export function stringifyList(list, separator = ', ') {
  return list.map(item => `'${item}'`).join(separator);
}
