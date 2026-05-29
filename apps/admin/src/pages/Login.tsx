import { Form, Input, Button, Card, message } from 'antd';
import { Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginRequest } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../lib/api-error';

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => loginRequest(email, password),
    onSuccess: async (data) => {
      if (data.access_token && data.user) {
        setAuth(data.user, data.access_token);
        queryClient.setQueryData(['auth', 'me'], data.user);
      }
      message.success('Kirish muvaffaqiyatli');
      await new Promise((resolve) => setTimeout(resolve, 100));
      navigate('/', { replace: true });
    },
    onError: (error: unknown) => {
      const err = error as ApiError;
      if (err.status === 401) {
        message.error("Email yoki parol noto'g'ri");
      } else {
        message.error(err.message || 'Kirishda xatolik');
      }
    },
  });

  const onFinish = async (values: { email: string; password: string }) => {
    await mutateAsync(values);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#2563EB] p-4">
      <Card className="w-full max-w-md shadow-2xl" styles={{ body: { padding: '32px 28px' } }} bordered={false}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2563EB]">
            <Stethoscope className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Acoustic.uz</h1>
          <p className="mt-1 text-sm text-slate-500">Admin panelga kirish</p>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical" autoComplete="off" size="large">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email kiriting' },
              { type: 'email', message: "To'g'ri email kiriting" },
            ]}
          >
            <Input placeholder="admin@acoustic.uz" />
          </Form.Item>
          <Form.Item label="Parol" name="password" rules={[{ required: true, message: 'Parol kiriting' }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={isPending} block className="h-11">
              Kirish
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
