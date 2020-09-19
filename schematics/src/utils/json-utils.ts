export function setProp(object, keys, val) {
  keys = Array.isArray(keys) ? keys : keys.split('.');
  if (keys.length > 1) {
    object[keys[0]] = object[keys[0]] || {};
    return setProp(object[keys[0]], keys.slice(1), val);
  }
  object[keys[0]] = val;
}

export function getProp(object, path, defaultValue = undefined) {
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key);
  const pathArrayFlat = pathArray.flatMap(part => (typeof part === 'string' ? part.split('.') : part));

  return pathArrayFlat.reduce((obj, key) => obj && obj[key], object) || defaultValue;
}
