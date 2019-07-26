import { TRANSLOCO_PARSER, DefaultParser } from '../transloco.parser';
import { TRANSLOCO_LOADER } from '../transloco.loader';
import { TRANSLOCO_CONFIG, defaultConfig } from '../transloco.config';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { DefaultHandler, TRANSLOCO_MISSING_HANDLER } from '../transloco-missing-handler';
import en from '../../../../../src/assets/langs/en.json';
import es from '../../../../../src/assets/langs/en.json';
import { tick } from '@angular/core/testing';

const langs = {
  en,
  es
};

export const configProviderMock = (config = {}) => ({
  provide: TRANSLOCO_CONFIG,
  useValue: { ...defaultConfig, ...config }
});

export const loaderProviderMock = {
  provide: TRANSLOCO_LOADER,
  useValue: load
};

export const parserProviderMock = {
  provide: TRANSLOCO_PARSER,
  useClass: DefaultParser
};

export const missingHandlerProviderMock = {
  provide: TRANSLOCO_MISSING_HANDLER,
  useClass: DefaultHandler
};

export const providersMock = [configProviderMock(), loaderProviderMock, parserProviderMock, missingHandlerProviderMock];

export function load(lang: string): any {
  return timer(1000).pipe(map(() => langs[lang])) as any;
}

export function runLoader(times = 1) {
  tick(times * 1001);
}
