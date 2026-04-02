// Mock for ora - avoids ESM import issues in Jest
const mockOra = () => ({
  start: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  info: jest.fn().mockReturnThis(),
  clear: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
  frame: jest.fn().mockReturnThis(),
  text: '',
  color: 'cyan',
  indent: 0,
  spinner: {},
  isSpinning: false,
});

export default mockOra;
module.exports = mockOra;
module.exports.default = mockOra;
