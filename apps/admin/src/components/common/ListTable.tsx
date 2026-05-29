import { Table } from 'antd';
import type { TableProps } from 'antd';
import EmptyState from './EmptyState';

const defaultPagination: TableProps['pagination'] = {
  pageSize: 20,
  showSizeChanger: true,
  showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
};

const EMPTY_LOADING = ' ';

export default function ListTable<T extends object>(props: TableProps<T>) {
  const { pagination, className, locale, loading, ...rest } = props;
  const tableLoading = Boolean(loading);

  const emptyText = tableLoading
    ? EMPTY_LOADING
    : locale?.emptyText !== undefined
      ? locale.emptyText
      : <EmptyState />;

  return (
    <div className="admin-content-card overflow-hidden">
      <Table<T>
        className={['modern-table', className].filter(Boolean).join(' ')}
        rowKey="id"
        loading={tableLoading}
        locale={{
          ...locale,
          emptyText,
        }}
        pagination={pagination === false ? false : { ...defaultPagination, ...(pagination as object) }}
        {...rest}
      />
    </div>
  );
}
