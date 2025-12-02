import { Component, signal } from '@angular/core';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';

import { TranslocoModule } from '../transloco.module';
import { TranslocoTestingModule } from '../transloco-testing.module';
import { translateSignal, translateObjectSignal } from '../transloco.signal';

import { providersMock, runLoader } from './mocks';

@Component({
  imports: [TranslocoModule],
  template: `
    <div id="text">{{ translatedText() }}</div>
    <div id="textObject">{{ translatedObject().title }}</div>
    <div id="dynamicKey">{{ translatedDynamicKey() }}</div>
    <div id="dynamicParam">{{ translatedDynamicParam() }}</div>
  `,
})
class TestComponent {
  translatedText = translateSignal('home');
  translatedObject = translateObjectSignal('nested');

  dynamicKey = signal('home');
  dynamicParam = signal('Signal');

  translatedDynamicKey = translateSignal(this.dynamicKey);
  translatedDynamicParam = translateSignal('alert', {
    value: this.dynamicParam,
  });

  translatedObjectDynamicKey = translateObjectSignal(this.dynamicKey);
  translatedObjectDynamicParam = translateObjectSignal(
    this.dynamicKey,
    this.dynamicParam,
  );

  changeKey(key: string) {
    this.dynamicKey.set(key);
  }

  changeParam(param: any) {
    this.dynamicParam.set(param);
  }
}

describe('translateSignal in component', () => {
  let spectator: Spectator<TestComponent>;
  const createComponent = createComponentFactory({
    component: TestComponent,
    imports: [TranslocoModule],
    providers: providersMock,
  });

  it(`GIVEN translateSignal with static key
      WHEN translations are loaded
      THEN should display translated text`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#text')).toHaveText('home english');
  }));

  it(`GIVEN translateSignal with dynamic key
      WHEN key changes
      THEN should update translated text`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    spectator.component.changeKey('fromList');
    spectator.detectChanges();
    expect(spectator.query('#dynamicKey')).toHaveText('from list');
  }));

  it(`GIVEN translateSignal with dynamic params
      WHEN params change
      THEN should update translation with new params`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    spectator.component.changeParam('Signal Changed');
    spectator.detectChanges();
    expect(spectator.query('#dynamicParam')).toHaveText(
      'alert Signal Changed english',
    );
  }));
});

describe('translateObjectSignal in component', () => {
  let spectator: Spectator<TestComponent>;
  const createComponent = createComponentFactory({
    component: TestComponent,
    imports: [TranslocoModule],
    providers: providersMock,
  });

  it(`GIVEN translateObjectSignal with static key
      WHEN translations are loaded
      THEN should return translation object`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#textObject')).toHaveText('Title english');
  }));

  it(`GIVEN translateObjectSignal with dynamic key
      WHEN key changes
      THEN should return updated translation object`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    spectator.component.changeKey('key.is.like');
    spectator.detectChanges();
    expect(spectator.component.translatedObjectDynamicKey()).toEqual({
      path: 'key is like path',
    });
  }));

  it(`GIVEN translateObjectSignal with dynamic params
      WHEN key and params change
      THEN should return translation object with interpolated params`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    spectator.component.changeKey('a.b');
    spectator.component.changeParam({ c: { fromList: 'Signal Changed' } });
    spectator.detectChanges();
    console.log(spectator.component.translatedObjectDynamicParam());
    expect(spectator.component.translatedObjectDynamicParam()).toEqual({
      c: 'a.b.c Signal Changed english',
    });
  }));
});

describe('Synchronous translateSignal', () => {
  @Component({
    standalone: true,
    imports: [TranslocoModule],
    template: ` <div id="text">{{ translatedText() }}</div> `,
  })
  class TestComponentStatic {
    translatedText = translateSignal('home');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestComponentStatic,
        TranslocoTestingModule.forRoot({
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
          langs: {
            en: {
              home: 'TranslatedHome',
            },
          },
        }),
      ],
    }).compileComponents();
  });

  it(`GIVEN translateSignal with static key
      WHEN translations are already loaded
      THEN should syncronously render the translated text`, () => {
    const fixture = TestBed.createComponent(TestComponentStatic);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#text')?.textContent).toContain(
      'TranslatedHome',
    );
  });
});
