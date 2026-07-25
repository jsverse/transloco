export const d = {
  provide: TRANSLOCO_SCOPE,
  useValue: 'scope1',
};
export const b = provideTranslocoScope({
  scope: 'scope2',
  alias: 'scopeAlias2',
});
export const c = provideTranslocoScope('scope3');
