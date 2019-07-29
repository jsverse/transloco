export default {
  alert: 'alert {{value}} spanish',
  home: 'home spanish',
  fromList: 'from list',
  a: {
    b: {
      c: 'a.b.c {{fromList}} spanish'
    }
  },
  dynamic(v) {
    return `Hello ${v} spanish...`;
  }
};
