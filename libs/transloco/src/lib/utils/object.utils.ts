export function getValue<T>(obj: T, path: keyof T) {
  if (!obj) {
    return obj;
  }

  /* For cases where the key is like: 'general.something.thing' */
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }

  return (path as string).split('.').reduce((p, c) => p?.[c], obj as any);
}

export function setValue(obj: any, prop: string, val: any) {
  obj = { ...obj };

  const split = prop.split('.');
  const lastIndex = split.length - 1;

  split.reduce((acc, part, index) => {
    if (index === lastIndex) {
      acc[part] = val;
    } else {
      acc[part] = Array.isArray(acc[part])
        ? acc[part].slice()
        : { ...acc[part] };
    }

    return acc && acc[part];
  }, obj);

  return obj;
}
