export function getValue(obj: object, path: string) {
  /* For cases where the key is like: 'general.something.thing' */
  if (obj && obj.hasOwnProperty(path)) {
    return obj[path];
  }
  return path.split('.').reduce((p, c) => (p && p[c]) || null, obj);
}

export function setValue(obj: any, prop: string, val: any) {
  obj = { ...obj };

  const split = prop.split('.');
  const lastIndex = split.length - 1;

  split.reduce((acc, part, index) => {
    if (index === lastIndex) {
      acc[part] = val;
    } else {
      acc[part] = Array.isArray(acc[part]) ? acc[part].slice() : { ...acc[part] };
    }

    return acc && acc[part];
  }, obj);

  return obj;
}

export function isFunction(val: any): val is Function {
  return typeof val === 'function';
}

export function isString(val: any): val is string {
  return typeof val === 'string';
}

export function isObject(item): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function mergeDeep(target: Object, ...sources: Object[]) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function isBrowser() {
  return typeof window !== 'undefined';
}
