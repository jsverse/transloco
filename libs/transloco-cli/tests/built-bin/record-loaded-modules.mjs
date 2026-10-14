// Preloaded with `node --import` by lazy-loading.spec.ts: appends the URL of
// every module the process loads to the file named by TRANSLOCO_LOADED_MODULES.
// `registerHooks` sees `require()` and `import` alike, so the record is complete
// for the CommonJS build as well as for an ES modules one.
import { appendFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

const record = process.env.TRANSLOCO_LOADED_MODULES;

registerHooks({
  load(url, context, nextLoad) {
    appendFileSync(record, `${url}\n`);

    return nextLoad(url, context);
  },
});
