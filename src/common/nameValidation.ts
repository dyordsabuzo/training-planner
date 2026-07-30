export const findDuplicateName = (
  entities: Record<string, { id?: string }> | undefined,
  name: string,
  currentId?: string
): boolean =>
  Object.keys(entities ?? {}).some(
    (key) =>
      key.trim().toLowerCase() === name.trim().toLowerCase() &&
      (entities as any)[key]?.id !== currentId
  );
