export function sanitizeForRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

export function toCamelCase(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+|_|-|\//g, '');
}
