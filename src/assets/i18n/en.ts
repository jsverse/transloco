export default {
  alert: 'alert {{value}} english',
  home: 'home english',
  fromList: 'from list',
  a: {
    b: {
      c: 'a.b.c {{fromList}} english'
    }
  },
  dynamic(v) {
    return `Hello ${v} english...`;
  },
  b: 'b english',
  c: 'c english'
};
