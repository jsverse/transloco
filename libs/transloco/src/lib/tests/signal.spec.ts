import {
  Component,
  inject,
  Injector,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';

import { Translation } from '../transloco.types';
import { TranslocoModule } from '../transloco.module';
import { TranslocoTestingModule } from '../transloco-testing.module';
import { translateSignal, translateObjectSignal } from '../transloco.signal';
import { translocoConfig } from '../transloco.config';
import { provideTransloco } from '../transloco.providers';

import { MockedLoader, providersMock, runLoader } from './mocks';

@Component({
  imports: [TranslocoModule],
  template: `
    <div id="text">{{ translatedText() }}</div>
    <div id="textObject">{{ translatedObject().title }}</div>
    <div id="dynamicKey">{{ translatedDynamicKey() }}</div>
    <div id="dynamicParam">{{ translatedDynamicParam() }}</div>
    <div id="outsideInjectionContextText">
      {{ outsideInjectionContextTranslatedText() }}
    </div>
    @if (outsideInjectionContextTranslatedObject(); as object) {
      <div id="outsideInjectionContextObject">
        {{ object.title }}
      </div>
    }
  `,
})
class TestComponent implements OnInit {
  private readonly injector = inject(Injector);
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

  outsideInjectionContextTranslatedText: Signal<string> = signal('UNDEFINED');
  outsideInjectionContextTranslatedObject: Signal<Translation | undefined> =
    signal(undefined);

  ngOnInit(): void {
    this.outsideInjectionContextTranslatedText = translateSignal(
      'home',
      undefined,
      undefined,
      this.injector,
    );
    this.outsideInjectionContextTranslatedObject = translateObjectSignal(
      'nested',
      undefined,
      undefined,
      this.injector,
    );
  }

  setOutsideInjectionContextTranslatedTextWithoutInjector(): void {
    this.outsideInjectionContextTranslatedText = translateSignal('home');
  }

  setOutsideInjectionContextTranslatedObjectWithoutInjector(): void {
    this.outsideInjectionContextTranslatedObject =
      translateObjectSignal('nested');
  }

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

  it(`GIVEN translateSignal with static key outside of an injection context
      WHEN translations are loaded with injector
      THEN should display translated text`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#outsideInjectionContextText')).toHaveText(
      'home english',
    );
  }));

  it(`GIVEN translateSignal with static key outside of an injection context
      WHEN translations are loaded without injector
      THEN should throw error`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(() =>
      spectator.component.setOutsideInjectionContextTranslatedTextWithoutInjector(),
    ).toThrow();
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

  it(`GIVEN translateObjectSignal with static key outside of an injection context
      WHEN translations are loaded with injector
      THEN should return translation object`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#outsideInjectionContextObject')).toHaveText(
      'Title english',
    );
  }));

  it(`GIVEN translateObjectSignal with static key outside of an injection context
      WHEN translations are loaded without injector
      THEN should throw error`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(() =>
      spectator.component.setOutsideInjectionContextTranslatedObjectWithoutInjector(),
    ).toThrow();
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

describe('translateSignal/translateObjectSignal with scope', () => {
  // Regression test: translateSignal/translateObjectSignal have always auto-prefixed keys
  // with the active scope (config.scopes.autoPrefixKeys, default true) - unlike the
  // *transloco directive/pipe, which require the caller to prefix the key manually
  // (translocoPrefix or writing the scope into the key by hand). 'title'/'obj' below are
  // deliberately left unprefixed - a rewrite of the scope/lang resolution engine once
  // silently broke this by passing a scope-stripped lang to service.translate/translateObject
  // instead of the scope-embedded path.
  @Component({
    imports: [TranslocoModule],
    template: `
      <div id="text">{{ translatedText() }}</div>
      <div id="object">{{ translatedObject().a?.b }}</div>
    `,
  })
  class TestScopedComponent {
    translatedText = translateSignal('title', undefined, 'lazy-page');
    translatedObject = translateObjectSignal('obj', undefined, 'lazy-page');
  }

  let spectator: Spectator<TestScopedComponent>;
  const createComponent = createComponentFactory({
    component: TestScopedComponent,
    imports: [TranslocoModule],
    providers: providersMock,
  });

  it(`GIVEN translateSignal/translateObjectSignal with a scope and an unprefixed key
      WHEN the scope loads
      THEN they should auto-prefix the key with the scope and display the translated value`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#text')).toHaveText('Admin Lazy english');
    expect(spectator.query('#object')).toHaveText('a.b english');
  }));
});

describe('translateSignal with scopes.autoPrefixKeys disabled', () => {
  // Covers the other branch of the auto-prefix behavior above: with
  // config.scopes.autoPrefixKeys: false, translateSignal must NOT prefix an
  // unprefixed key with the active scope - the caller has to spell out the
  // full key themselves, same as translate()/translateObject() already do
  // for the directive/pipe regardless of this flag.
  @Component({
    imports: [TranslocoModule],
    template: `
      <div id="unprefixed">{{ unprefixed() }}</div>
      <div id="manuallyPrefixed">{{ manuallyPrefixed() }}</div>
    `,
  })
  class TestNoAutoPrefixComponent {
    unprefixed = translateSignal('title', undefined, 'lazy-page');
    manuallyPrefixed = translateSignal(
      'lazyPage.title',
      undefined,
      'lazy-page',
    );
  }

  let spectator: Spectator<TestNoAutoPrefixComponent>;
  const createComponent = createComponentFactory({
    component: TestNoAutoPrefixComponent,
    imports: [TranslocoModule],
    providers: provideTransloco({
      config: translocoConfig({
        availableLangs: ['en', 'es'],
        scopes: { autoPrefixKeys: false },
      }),
      loader: MockedLoader,
    }),
  });

  it(`GIVEN translateSignal with a scope and scopes.autoPrefixKeys disabled
      WHEN the scope loads
      THEN an unprefixed key should not resolve, but a manually-prefixed one should`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    // Falls back to the missing-key handler's default (returns the key as-is).
    expect(spectator.query('#unprefixed')).toHaveText('title');
    expect(spectator.query('#manuallyPrefixed')).toHaveText(
      'Admin Lazy english',
    );
  }));
});
