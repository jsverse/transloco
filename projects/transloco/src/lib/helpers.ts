export function getValue(obj: object, path: string) {
  return path.split('.').reduce((p, c) => (p && p[c]) || null, obj);
}
