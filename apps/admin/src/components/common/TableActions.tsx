import { Button, Popconfirm, Space, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

interface TableActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  deleteTitle?: string;
  deleteDescription?: string;
  loading?: boolean;
  extra?: React.ReactNode;
}

export default function TableActions({
  onEdit,
  onDelete,
  deleteTitle = "O'chirishni tasdiqlaysizmi?",
  deleteDescription = "Bu amalni qaytarib bo'lmaydi.",
  loading,
  extra,
}: TableActionsProps) {
  return (
    <Space size={4}>
      {extra}
      {onEdit && (
        <Tooltip title="Tahrirlash">
          <Button type="text" icon={<EditOutlined />} onClick={onEdit} />
        </Tooltip>
      )}
      {onDelete && (
        <Popconfirm
          title={deleteTitle}
          description={deleteDescription}
          onConfirm={onDelete}
          okText="O'chirish"
          cancelText="Bekor qilish"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="O'chirish">
            <Button type="text" danger icon={<DeleteOutlined />} loading={loading} />
          </Tooltip>
        </Popconfirm>
      )}
    </Space>
  );
}
