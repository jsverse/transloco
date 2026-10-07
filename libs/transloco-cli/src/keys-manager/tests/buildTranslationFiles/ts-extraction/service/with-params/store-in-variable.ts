import { TranslocoService } from '@jsverse/transloco';
import { inject } from '@angular/core';
import { Observable, zip, switchMap, tap, map, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PermissionService } from './permission.service';

export function hasPermissionFactory(): Observable<string> {
  const permission = inject(PermissionService);
  const translate = inject(TranslocoService);
  const snackBarManager = inject(MatSnackBar);

  return permission.hasPermissions().pipe(
    switchMap((hasPermission) => {
      if (!hasPermission) {
        return zip([
          translate.selectTranslate('variable', { variable: 'hasPermission' }),
          translate.selectTranslate('another.variable', {
            another: { variable: 'hasPermission' },
          }),
        ]).pipe(
          tap(([message, close]) => {
            snackBarManager.open(message, close, {
              duration: 3000,
              horizontalPosition: 'right',
            });
          }),
          map(() => false),
        );
      }
      return of(true);
    }),
  );
}
