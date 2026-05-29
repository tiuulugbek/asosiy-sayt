import { useState } from 'react';
import { Alert, Button, Card, Col, Empty, Row, Select, Space, Spin, Statistic, Table, Tag, Typography } from 'antd';
import { BarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import PageHeader from '../components/common/PageHeader';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { ApiError, getTrafficReport, TrafficDailyStats, TrafficListItem, TrafficMonthlyStats, TrafficReportDto } from '../lib/api';

const { Title, Text } = Typography;

const numberFormatter = new Intl.NumberFormat('uz-UZ');
const dateFormatter = new Intl.DateTimeFormat('uz-UZ', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatNumber = (value: number) => numberFormatter.format(value);

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};

const formatMonth = (value: string) => {
  const [year, month] = value.split('-');
  return `${month}.${year}`;
};

function MiniLineChart({ data }: { data: TrafficDailyStats[] }) {
  const width = 760;
  const height = 220;
  const padding = 28;
  const maxValue = Math.max(...data.map((item) => item.pageviews), 1);

  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (item.pageviews / maxValue) * (height - padding * 2);
    return { x, y, item };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 620, height }}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f0f0f0" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#f0f0f0" />
        <polyline fill="none" stroke="#2563EB" strokeWidth="3" points={line} />
        {points.map((point) => (
          <g key={point.item.date}>
            <circle cx={point.x} cy={point.y} r="4" fill="#2563EB" />
            <text x={point.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#8c8c8c">
              {point.item.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HorizontalBars({ data }: { data: TrafficListItem[] }) {
  const maxValue = Math.max(...data.map((item) => item.count), 1);

  if (!data.length) {
    return <Empty description="Ma'lumot yo'q" />;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {data.map((item) => (
        <div key={item.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <Text ellipsis style={{ maxWidth: '70%' }}>{item.name}</Text>
            <Text strong>{formatNumber(item.count)}</Text>
          </div>
          <div style={{ height: 10, background: '#f5f5f5', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.max((item.count / maxValue) * 100, 2)}%`,
                height: '100%',
                background: '#F07E22',
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </Space>
  );
}

const periodOptions = [
  { label: 'Bugun', value: 1 },
  { label: 'Kecha', value: 2 },
  { label: '7 kun', value: 7 },
  { label: '15 kun', value: 15 },
  { label: '30 kun', value: 30 },
  { label: '90 kun', value: 90 },
];

export default function TrafficPage() {
  const [days, setDays] = useState(15);
  const { data, isLoading, isFetching, error, refetch } = useQuery<TrafficReportDto, ApiError>({
    queryKey: ['traffic-report', days],
    queryFn: () => getTrafficReport(days),
    refetchInterval: 5 * 60 * 1000,
  });

  const dailyColumns: ColumnsType<TrafficDailyStats> = [
    {
      title: 'Sana',
      dataIndex: 'date',
      key: 'date',
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Ko‘rishlar',
      dataIndex: 'pageviews',
      key: 'pageviews',
      align: 'right',
      render: formatNumber,
    },
    {
      title: 'Tashriflar',
      dataIndex: 'visits',
      key: 'visits',
      align: 'right',
      render: formatNumber,
    },
    {
      title: 'Unique IP',
      dataIndex: 'uniqueIps',
      key: 'uniqueIps',
      align: 'right',
      render: formatNumber,
    },
    {
      title: 'Bot so‘rovlar',
      dataIndex: 'botRequests',
      key: 'botRequests',
      align: 'right',
      render: formatNumber,
    },
  ];

  const monthlyColumns: ColumnsType<TrafficMonthlyStats> = [
    {
      title: 'Oy',
      dataIndex: 'month',
      key: 'month',
      render: formatMonth,
    },
    {
      title: 'Ko‘rishlar',
      dataIndex: 'pageviews',
      key: 'pageviews',
      align: 'right',
      render: formatNumber,
    },
    {
      title: 'Tashriflar',
      dataIndex: 'visits',
      key: 'visits',
      align: 'right',
      render: formatNumber,
    },
    {
      title: 'Unique IP',
      dataIndex: 'uniqueIps',
      key: 'uniqueIps',
      align: 'right',
      render: formatNumber,
    },
    {
      title: 'Raw so‘rovlar',
      dataIndex: 'rawRequests',
      key: 'rawRequests',
      align: 'right',
      render: formatNumber,
    },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Statistikani yuklashda xatolik"
        description={error.message}
      />
    );
  }

  if (!data) {
    return <Empty description="Statistika topilmadi" />;
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PageHeader
        title="Statistika"
        description={`Davr: ${formatDate(data.range.from)} — ${formatDate(data.range.to)}`}
        action={
          <Space>
            <Select
              value={days}
              onChange={setDays}
              options={periodOptions}
              style={{ minWidth: 120 }}
            />
            <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
              Yangilash
            </Button>
          </Space>
        }
      />

      <Alert type="info" showIcon message="Hisoblash usuli" description={data.note} />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Ko‘rishlar" value={data.summary.pageviews} formatter={(value) => formatNumber(Number(value))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Tashriflar" value={data.summary.visits} formatter={(value) => formatNumber(Number(value))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Unique IP" value={data.summary.uniqueIps} formatter={(value) => formatNumber(Number(value))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Bot so‘rovlar chiqarildi" value={data.summary.botRequests} formatter={(value) => formatNumber(Number(value))} />
          </Card>
        </Col>
      </Row>

      <Card title="Kunlik trend">
        <MiniLineChart data={data.daily} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Eng ko‘p ko‘rilgan sahifalar">
            <HorizontalBars data={data.topPages} />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Tashqi manbalar">
            <HorizontalBars data={data.topReferrers} />
          </Card>
        </Col>
      </Row>

      <Card title="Oylik jamlanma">
        <Table
          rowKey="month"
          columns={monthlyColumns}
          dataSource={data.monthly}
          pagination={false}
          size="middle"
        />
      </Card>

      <Card
        title="Kunlik jadval"
        extra={
          <Space>
            <Tag color="green">200 OK: {formatNumber(data.summary.ok200)}</Tag>
            <Tag color="orange">404: {formatNumber(data.summary.notFound404)}</Tag>
            <Tag color={data.summary.serverErrors5xx > 0 ? 'red' : 'default'}>
              5xx: {formatNumber(data.summary.serverErrors5xx)}
            </Tag>
          </Space>
        }
      >
        <Table
          rowKey="date"
          columns={dailyColumns}
          dataSource={[...data.daily].reverse()}
          pagination={false}
          size="middle"
        />
      </Card>
    </Space>
  );
}
