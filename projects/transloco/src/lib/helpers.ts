export function getValue(obj: object, path: string) {
  return path.split('.').reduce((p, c) => (p && p[c]) || null, obj);
}

export function isString(val: any): boolean {
  return typeof val === 'string';
}
