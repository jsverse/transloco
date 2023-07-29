export type PersistStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>;
