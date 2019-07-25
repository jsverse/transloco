import { TranslocoService, TranslocoParamsPipe } from '@ngneat/transloco';
import { Mock } from 'ts-mocks';
import { TranslocoMissingHandler } from '../transloco-missing-handler';

describe('TranslocoParamsPipe', () => {
  let missingHandlerMock;
  let translateServiceMock;
  let pipe: TranslocoParamsPipe;

  beforeEach(() => {
    missingHandlerMock = new Mock<TranslocoMissingHandler>({ handle: () => {} }).Object;
    translateServiceMock = new Mock<TranslocoService>({ translateValue: (v, p) => '' }).Object;
    pipe = new TranslocoParamsPipe(translateServiceMock, missingHandlerMock);
  });

  it('should call missing when value is falsy', () => {
    pipe.transform(null);
    pipe.transform(undefined);

    expect(missingHandlerMock.handle).toHaveBeenCalledTimes(2);
  });

  it('should call translate service when value is truthy', () => {
    pipe.transform('some value');
    pipe.transform('some other value', { param: 'param' });

    expect(translateServiceMock.translateValue).toHaveBeenCalledTimes(2);
  });
});
