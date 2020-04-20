const removeComments = require('./remove-comments');
const assert = require('assert');

const translation = {
  a: '',
  'a.comment': '',
  b: '',
  c: '',
  d: {
    e: '',
    'e.comment': '',
    f: '',
    vv: {
      ff: '',
      'ff.comment': '',
      gg: {
        eee: '',
        cc: '',
        'eee.comment': ''
      }
    }
  },
  comment: ''
};

const expected = {
  a: '',
  b: '',
  c: '',
  d: {
    e: '',
    f: '',
    vv: {
      ff: '',
      gg: {
        eee: '',
        cc: ''
      }
    }
  },
  comment: ''
};

const result = removeComments(translation, '.comment');

assert.equal(JSON.stringify(result), JSON.stringify(expected));
