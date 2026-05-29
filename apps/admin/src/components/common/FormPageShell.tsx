import type { ReactNode } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';

interface FormPageShellProps {
  title: string;
  description?: string;
  backTo: string;
  children: ReactNode;
}

export default function FormPageShell({ title, description, backTo, children }: FormPageShellProps) {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button type="link" onClick={() => navigate(backTo)}>
            ← Orqaga
          </Button>
        }
      />
      {children}
    </div>
  );
}
