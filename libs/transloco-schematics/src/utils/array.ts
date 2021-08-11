export function stringifyList<T>(list: T[], separator = ', '): string {
  return list.map(item => `'${item}'`).join(separator);
}
