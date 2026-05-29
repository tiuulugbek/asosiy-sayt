import { useEffect, useMemo, useState } from 'react';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { HolderOutlined } from '@ant-design/icons';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ListTable from './ListTable';

interface SortableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

function SortableRow({ children, ...props }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });
  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes}>
      {Array.isArray(children)
        ? children.map((child, i) => {
            if (i === 0 && child && typeof child === 'object' && 'props' in child) {
              return (
                <td key="drag" className="cursor-grab active:cursor-grabbing" {...listeners}>
                  <HolderOutlined className="text-gray-400" />
                </td>
              );
            }
            return child;
          })
        : children}
    </tr>
  );
}

interface SortableTableProps<T extends { id: string }> extends Omit<TableProps<T>, 'columns' | 'components'> {
  columns: ColumnsType<T>;
  dataSource?: T[];
  onReorder: (orderedIds: string[]) => Promise<void>;
  reordering?: boolean;
}

export default function SortableTable<T extends { id: string }>({
  columns,
  dataSource = [],
  onReorder,
  reordering,
  ...rest
}: SortableTableProps<T>) {
  const [items, setItems] = useState(dataSource);

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const dragColumn: ColumnsType<T>[0] = {
    key: 'sort',
    width: 48,
    render: () => null,
  };

  const mergedColumns = [dragColumn, ...columns];

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    await onReorder(next.map((i) => i.id));
  };

  useEffect(() => {
    setItems(dataSource);
  }, [dataSource]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ListTable<T>
          {...rest}
          loading={rest.loading || reordering}
          dataSource={items}
          columns={mergedColumns}
          components={{ body: { row: SortableRow } }}
        />
      </SortableContext>
    </DndContext>
  );
}
