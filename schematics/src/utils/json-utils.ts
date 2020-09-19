/**
 * set the value for the path provided in keys.
 *
 * @param object Object like a json, for example
 * @param keys keys to access the property (string like key1.key2 or ['key1', 'key2'])
 * @param val value to set at this place
 */
export function setProp(object, keys, val) {
  keys = Array.isArray(keys) ? keys : keys.split('.');
  if (keys.length > 1) {
    object[keys[0]] = object[keys[0]] || {};
    return setProp(object[keys[0]], keys.slice(1), val);
  }
  object[keys[0]] = val;
}

/**
 * This function works like the 'get' as Lodash
 *
 * @param object Object like a json, for example.
 * @param path Generally a string like key1.key2 or array like ['key1', 'key2']
 * @param defaultValue if a value is not found, provide a default value. default: undefined
 */
export function getProp(object, path, defaultValue = undefined) {
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key);
  const pathArrayFlat = pathArray.flatMap(part => (typeof part === 'string' ? part.split('.') : part));

  return pathArrayFlat.reduce((obj, key) => obj && obj[key], object) || defaultValue;
}
