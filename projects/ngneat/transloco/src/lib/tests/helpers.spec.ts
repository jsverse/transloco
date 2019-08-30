import { getPipeValue } from '../helpers';

describe('getPipeValue', () => {
  it('should work', () => {
    expect(getPipeValue(null, 'static')).toEqual([false, '']);
    expect(getPipeValue('en', 'static')).toEqual([false, 'en']);
    expect(getPipeValue('en|static', 'static')).toEqual([true, 'en']);
    expect(getPipeValue('todos-page|static', 'static')).toEqual([true, 'todos-page']);
  });
});
