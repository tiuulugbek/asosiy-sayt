import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Button, Card, Form, Input, Layout, Select, Space, Table, Tag, Typography } from 'antd';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';

const API = (import.meta as any).env?.VITE_QR_API_URL || '/api';
const brandBlue = '#3F3091';
const brandOrange = '#F07E22';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

function LoginPage() {
  const branches = useQuery({ queryKey: ['branches'], queryFn: () => api<any[]>('/qr/branches') });
  const m = useMutation({
    mutationFn: (v: any) => api('/qr-auth/login', { method: 'POST', body: JSON.stringify(v) }),
    onSuccess: () => (window.location.href = '/'),
  });

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fc' }}>
      <Layout.Content style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}>
        <div style={{ background: `linear-gradient(140deg, ${brandBlue}, #6a5ac9)`, color: '#fff', padding: 48 }}>
          <Typography.Title style={{ color: '#fff' }}>Acoustic QR</Typography.Title>
          <Typography.Paragraph style={{ color: '#f3f1ff', maxWidth: 480 }}>
            Centralized QR tracking dashboard for branches, campaigns, and landing performance.
          </Typography.Paragraph>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
          <Card title="Sign In" style={{ width: 420 }}>
            <Form onFinish={(v) => m.mutate(v)} layout="vertical">
              <Form.Item name="branchId" label="Branch" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'super-admin', label: 'Super Admin' },
                    ...(branches.data || []).map((b) => ({ value: b.id, label: b.name_uz })),
                  ]}
                />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                <Input.Password />
              </Form.Item>
              <Button htmlType="submit" type="primary" loading={m.isPending} style={{ background: brandOrange }}>
                Login
              </Button>
            </Form>
          </Card>
        </div>
      </Layout.Content>
    </Layout>
  );
}

function Protected() {
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<any>('/qr-auth/me') });
  const qrs = useQuery({ queryKey: ['qrs'], queryFn: () => api<any[]>('/qr-codes') });
  const summary = useQuery({ queryKey: ['summary'], queryFn: () => api<any>('/qr-analytics/summary') });
  const branches = useQuery({ queryKey: ['branch-performance'], queryFn: () => api<any[]>('/qr-analytics/branch-performance') });
  const logout = useMutation({ mutationFn: () => api('/qr-auth/logout', { method: 'POST' }), onSuccess: () => (window.location.href = '/login') });

  if (me.isError) return <Navigate to="/login" replace />;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ background: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: '16px 0', color: brandBlue }}>Acoustic QR</Typography.Title>
        <Space>
          <Tag color="blue">{(me.data as any)?.loginType || '...'}</Tag>
          <Button onClick={() => logout.mutate()}>Logout</Button>
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: 24, display: 'grid', gap: 16 }}>
        <Space wrap>
          <Card title="Total QR" style={{ width: 180 }}>{summary.data?.totalQrCodes ?? '-'}</Card>
          <Card title="Active QR" style={{ width: 180 }}>{summary.data?.activeQrCodes ?? '-'}</Card>
          <Card title="Total Scans" style={{ width: 180 }}>{summary.data?.totalScans ?? '-'}</Card>
          <Card title="Unique Scans" style={{ width: 180 }}>{summary.data?.uniqueScans ?? '-'}</Card>
        </Space>

        <Card title="QR Codes">
          <Table
            rowKey="id"
            dataSource={qrs.data || []}
            columns={[
              { title: 'ID', dataIndex: 'displayId' },
              { title: 'Name', dataIndex: 'name' },
              { title: 'Branch', render: (_: any, r: any) => r.branch?.name_uz || r.branchId },
              { title: 'Destination', dataIndex: 'destinationUrl' },
              { title: 'Status', dataIndex: 'status' },
              { title: 'Total scans', dataIndex: 'totalScans' },
            ]}
          />
        </Card>

        <Card title="Branch Performance">
          <Table
            rowKey={(r) => r.branch.id}
            dataSource={branches.data || []}
            columns={[
              { title: 'Branch', render: (_: any, r: any) => r.branch.name_uz },
              { title: 'Active QR', dataIndex: 'activeQrCount' },
              { title: 'Total scans', dataIndex: 'totalScans' },
              { title: 'Unique scans', dataIndex: 'uniqueScans' },
            ]}
          />
        </Card>
      </Layout.Content>
    </Layout>
  );
}

const qc = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Protected />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
