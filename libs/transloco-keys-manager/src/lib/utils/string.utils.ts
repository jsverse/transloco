export function sanitizeForRegex(str: string) {
  return str
    .split('')
    .map((char) => (['$', '^', '/'].includes(char) ? `\\${char}` : char))
    .join('');
}

export function toCamelCase(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+|_|-|\//g, '');
}
