/** Tartibni yangilash — har bir element uchun PATCH (reorder API yo'q) */
export async function applyOrderUpdates(
  orderedIds: string[],
  updateFn: (id: string, order: number) => Promise<unknown>,
  step = 10,
): Promise<void> {
  await Promise.all(orderedIds.map((id, index) => updateFn(id, index * step)));
}
