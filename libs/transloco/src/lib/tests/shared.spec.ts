import { getPipeValue } from '../utils/pipe.utils';
import { getLangFromScope, getScopeFromLang } from '../utils/scope.utils';
import { shouldListenToLangChanges } from '../utils/lang.utils';

describe('getPipeValue', () => {
  it(`GIVEN various pipe value inputs
      WHEN getPipeValue is called
      THEN should parse static marker correctly`, () => {
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
  it(`GIVEN various scope/lang combinations
      WHEN getLangFromScope is called
      THEN should extract lang correctly`, () => {
    expect(getLangFromScope('en')).toEqual('en');
    expect(getLangFromScope('todos/en')).toEqual('en');
    expect(getLangFromScope('some/nested/es')).toEqual('es');
    expect(getLangFromScope('')).toEqual('');
  });
});

describe('getScopeFromLang', () => {
  it(`GIVEN various scope/lang combinations
      WHEN getScopeFromLang is called
      THEN should extract scope correctly`, () => {
    expect(getScopeFromLang('en')).toEqual('');
    expect(getScopeFromLang('todos/en')).toEqual('todos');
    expect(getScopeFromLang('some/nested/es')).toEqual('some/nested');
    expect(getScopeFromLang('')).toEqual('');
  });
});

describe('shouldListenToLangChanges', () => {
  it(`GIVEN lang with static marker
      WHEN shouldListenToLangChanges is called
      THEN should return false`, () => {
    expect(
      shouldListenToLangChanges(
        {
          config: {
            reRenderOnLangChange: true,
          },
        } as any,
        'es|static',
      ),
    ).toEqual(false);
  });

  it(`GIVEN lang without static and reRenderOnLangChange is true
      WHEN shouldListenToLangChanges is called
      THEN should return true`, () => {
    expect(
      shouldListenToLangChanges(
        {
          config: {
            reRenderOnLangChange: true,
          },
        } as any,
        'es',
      ),
    ).toEqual(true);
  });

  it(`GIVEN lang without static but reRenderOnLangChange is false
      WHEN shouldListenToLangChanges is called
      THEN should return false`, () => {
    expect(
      shouldListenToLangChanges(
        {
          config: {
            reRenderOnLangChange: false,
          },
        } as any,
        'es',
      ),
    ).toEqual(false);
  });
});
