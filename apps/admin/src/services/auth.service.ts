import api from '../lib/axios';
import type { UserDto } from '../lib/api';

export interface LoginResponse {
  user: UserDto;
  access_token: string;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout');
}

export async function fetchMe(): Promise<UserDto> {
  const { data } = await api.get<UserDto>('/auth/me');
  return data;
}
