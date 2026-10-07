import { TranslocoService } from '@jsverse/transloco';

export class DynamicComponent {
  constructor(private readonly transloco: TranslocoService) {}

  /**
   * _(role.admin, role.guest)
   * t(ignored.in.ts)
   */
  role(name: string) {
    return this.transloco.translate(`role.${name}`);
  }
}
