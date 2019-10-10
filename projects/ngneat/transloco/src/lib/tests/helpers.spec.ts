import { getLangFromScope, getPipeValue, getScopeFromLang } from '../helpers';

describe('getPipeValue', () => {
  it('should work', () => {
    expect(getPipeValue(null, 'static')).toEqual([false, '']);
    expect(getPipeValue('en', 'static')).toEqual([false, 'en']);
    expect(getPipeValue('en|static', 'static')).toEqual([true, 'en']);
    expect(getPipeValue('todos-page|static', 'static')).toEqual([true, 'todos-page']);
  });
});

describe('getLangFromScope', () => {
  it('should work', () => {
    expect(getLangFromScope('en')).toEqual('en');
    expect(getLangFromScope('todos/en')).toEqual('en');
    expect(getLangFromScope('some/nested/es')).toEqual('es');
    expect(getLangFromScope('')).toEqual('');
  });
});

describe('getScopeFromLang', () => {
  it('should work', () => {
    expect(getScopeFromLang('en')).toEqual('');
    expect(getScopeFromLang('todos/en')).toEqual('todos');
    expect(getScopeFromLang('some/nested/es')).toEqual('some/nested');
    expect(getScopeFromLang('')).toEqual('');
  });
});
