import { NgModule } from '@angular/core';

import { InlineLoadersRoutingModule } from './inline-loaders-routing.module';
import { InlineComponent } from './inline/inline.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

const loader = ['en'].reduce((acc: any, lang: string) => {
  acc[lang] = () => import(`./i18n/${lang}.json`);
  return acc;
}, {});

@NgModule({
  declarations: [InlineComponent],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'inline',
        loader
      }
    }
  ],
  imports: [InlineLoadersRoutingModule, TranslocoModule]
})
export class InlineLoadersModule {}
