import { Tabs } from 'antd';
import type { TabsProps } from 'antd';

/** Underline uslubidagi tablar */
export default function ModernTabs(props: TabsProps) {
  return (
    <Tabs
      {...props}
      className={['admin-modern-tabs', props.className].filter(Boolean).join(' ')}
    />
  );
}
