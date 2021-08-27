import {
  getLangFromScope,
  getPipeValue,
  getScopeFromLang,
  shouldListenToLangChanges,
} from '../shared';

describe('getPipeValue', () => {
  it('should work', () => {
    expect(getPipeValue(undefined, 'static')).toEqual([false, '']);
    expect(getPipeValue('en', 'static')).toEqual([false, 'en']);
    expect(getPipeValue('en|static', 'static')).toEqual([true, 'en']);
    expect(getPipeValue('todos-page|static', 'static')).toEqual([
      true,
      'todos-page',
    ]);
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

describe('shouldListenToLangChanges', () => {
  it('should return false when lang contains static', () => {
    expect(
      shouldListenToLangChanges(
        {
          config: {
            reRenderOnLangChange: true,
          },
        } as any,
        'es|static'
      )
    ).toEqual(false);
  });

  it('should return true when lang does not contains static and reRenderOnLangChange is true', () => {
    expect(
      shouldListenToLangChanges(
        {
          config: {
            reRenderOnLangChange: true,
          },
        } as any,
        'es'
      )
    ).toEqual(true);
  });

  it('should return false when lang does not contains static and reRenderOnLangChange is false', () => {
    expect(
      shouldListenToLangChanges(
        {
          config: {
            reRenderOnLangChange: false,
          },
        } as any,
        'es'
      )
    ).toEqual(false);
  });
});
