import {TRANSLOCO_PARSER, DefaultParser} from "../transloco.parser"
import {TRANSLOCO_LOADER} from "../transloco.loader"
import {TRANSLOCO_CONFIG, defaultConfig} from "../transloco.config"
import {timer} from "rxjs";
import {map} from "rxjs/operators";
import {DefaultHandler, TRANSLOCO_MISSING_HANDLER} from "../transloco-missing-handler";

export const configProviderMock = (config = {}) => ({
  provide: TRANSLOCO_CONFIG,
  useValue: {...defaultConfig, ...config}
});

export const loaderProviderMock = {
    provide: TRANSLOCO_LOADER,
    useValue: () => timer(1000).pipe(map(() => ({ alert: 'Alert' })))
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
