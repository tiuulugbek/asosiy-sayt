/** Jadval loading holati — Empty flash oldini olish uchun */
export function useTableLoading(state: {
  isLoading: boolean;
  isFetching?: boolean;
  isPending?: boolean;
}): boolean {
  return Boolean(state.isLoading || state.isFetching || state.isPending);
}
