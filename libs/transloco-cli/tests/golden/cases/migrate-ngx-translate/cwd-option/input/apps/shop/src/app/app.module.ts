import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';

@NgModule({
  imports: [TranslateModule.forRoot({ defaultLanguage: 'en' })],
  declarations: [AppComponent],
})
export class AppModule {}
