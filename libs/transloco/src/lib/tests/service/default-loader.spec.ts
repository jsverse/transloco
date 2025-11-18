import { DefaultLoader } from '../../transloco.loader';
import { TranslocoService } from '../../transloco.service';
import { createService } from '../mocks';

describe('default loader', () => {
  it(`GIVEN no loader is provided
      WHEN service is created
      THEN should not throw and use the default loader`, () => {
    let service: TranslocoService;

    expect(function () {
      service = createService(
        {
          availableLangs: ['en'],
        },
        { loader: null as any },
      );
    }).not.toThrow();
    expect((service! as any).loader instanceof DefaultLoader).toBe(true);
    service!.setTranslation(
      {
        key: 'Netanel',
      },
      'en',
    );
    expect(service!.translate('key')).toEqual('Netanel');
  });
});
