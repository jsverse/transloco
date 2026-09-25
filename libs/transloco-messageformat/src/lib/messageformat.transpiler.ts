import { Inject, Injectable, Optional } from '@angular/core';
import {
  DefaultTranspiler,
  getValue,
  setValue,
  TranspileParams,
} from '@jsverse/transloco';
import { isObject, isString } from '@jsverse/utils';
import MessageFormat, { MessageFormatOptions } from '@messageformat/core';

import {
  MessageformatConfig,
  MFLocale,
  TRANSLOCO_MESSAGE_FORMAT_CONFIG,
} from './messageformat.config';
import {
  cachedFactory,
  defaultFactory,
  MFFactory,
} from './messageformat.factory';

type Params = NonNullable<TranspileParams['params']>;
type ParamsNode = Record<string, unknown> | unknown[];

// Characters that open an ICU quoted literal (`'{`, `'}`, `'#`) - used by
// the apostrophe fixup below to spot one already starting in static text.
const QUOTE_TRIGGER_CHARS = /[{}#]/;
// Characters that make a param value invalid to splice as literal text
// (parsed as ICU syntax). Not '#': outside a plural/selectordinal case it is
// already literal, and inside one a param can legitimately need it kept as
// syntax - a MessageFormat number-skeleton pattern (`¤#,##0.00`) supplied
// via `{{ }}` is parsed by the compiler, so protecting it would silently
// change the resulting format instead of fixing a real parse failure. A
// bare '#' from an interpolated value landing inside a plural case is
// therefore still replaced by the count, same as before this fix - see
// protectParams's doc comment.
const PROTECT_CHARS = /[{}]/;
const MF_ARG_PREFIX = '__translocoParam';
const EMPTY_TOKENS: ReadonlySet<string> = new Set();

function isPlainObject(value: unknown): value is Params {
  if (!isObject(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);

  return proto === Object.prototype || proto === null;
}

@Injectable()
export class MessageFormatTranspiler extends DefaultTranspiler {
  private messageFormat: MessageFormat;
  private readonly messageConfig: MessageFormatOptions<'string'>;
  private readonly mfFactory: MFFactory;

  constructor(
    @Optional()
    @Inject(TRANSLOCO_MESSAGE_FORMAT_CONFIG)
    config: MessageformatConfig,
  ) {
    super();
    const {
      locales,
      enableCache = true,
      ...messageConfig
    } = { locales: null, ...config };
    this.messageConfig = messageConfig;
    this.mfFactory = enableCache ? cachedFactory : defaultFactory;
    this.messageFormat = this.mfFactory(locales, messageConfig);
  }

  transpile({ value, params = {}, translation, key }: TranspileParams) {
    if (!value) {
      return value;
    }

    if (isObject(value) && params) {
      Object.keys(params).forEach((p) => {
        const subValue = getValue(value as Record<string, unknown>, p);
        const [safeParams, mfArgs, tokens] = this.protectParams(
          subValue,
          getValue(params, p) as Params | undefined,
        );
        const transpiled = this.interpolate(
          { value: subValue, params: safeParams, translation, key },
          tokens,
        );
        const message = this.messageFormat.compile(transpiled);
        value = setValue(value, p, message(mfArgs));
      });
    } else if (!Array.isArray(value)) {
      const [safeParams, mfArgs, tokens] = this.protectParams(value, params);
      const transpiled = this.interpolate(
        { value, params: safeParams, translation, key },
        tokens,
      );

      const message = this.messageFormat.compile(transpiled);
      return message(mfArgs);
    }

    return value;
  }

  onLangChanged(lang: string) {
    this.setLocale(lang);
  }

  setLocale(locale: MFLocale) {
    this.messageFormat = this.mfFactory(locale, this.messageConfig);
  }

  /**
   * Runs the default `{{ }}` interpolation, then, only when this call
   * actually generated placeholders, fixes up any apostrophe that ends up
   * directly before one, which would otherwise open (or extend) an ICU
   * quoted section.
   */
  private interpolate(params: TranspileParams, tokens: ReadonlySet<string>) {
    const transpiled = super.transpile(params);

    return isString(transpiled) && tokens.size > 0
      ? this.escapeApostrophesBeforePlaceholders(transpiled, tokens)
      : transpiled;
  }

  /**
   * `'{ ... }'`-style ICU quoting - used to display a literal brace - is
   * common in hand-written messages and must be left exactly as it is: a
   * placeholder landing inside one stays inert text instead of resolving
   * (a documented limit, see protectParams). What must NOT happen is an
   * apostrophe that is only adjacent to a placeholder by accident of our
   * own splicing (`l'{{ item }}`) being misread as opening one of those
   * spans, silently swallowing everything up to the message's next
   * unrelated apostrophe.
   *
   * `tokens` is the exact set of `{name}` strings THIS call generated (see
   * protectParams) - checked instead of a generic `{__translocoParamN}`
   * shape, so hand-authored text that merely resembles one (unlikely, but
   * possible) is never mistaken for a placeholder we ourselves inserted.
   *
   * So: scan left to right: hop over any apostrophe already followed by a
   * quote-triggering char that closes again (a genuine, self-contained
   * quote) untouched; for one that instead runs straight into one of our
   * placeholders before any close, double it, since a translator cannot
   * have written our own generated token inside their quoting.
   */
  private escapeApostrophesBeforePlaceholders(
    text: string,
    tokens: ReadonlySet<string>,
  ): string {
    let out = '';
    let i = 0;
    while (i < text.length) {
      if (text[i] !== "'") {
        out += text[i];
        i += 1;
        continue;
      }

      if (text[i + 1] === "'") {
        out += "''";
        i += 2;
        continue;
      }

      const span =
        QUOTE_TRIGGER_CHARS.test(text[i + 1] ?? '') &&
        this.matchQuotedSpan(text, i, tokens);
      if (span) {
        out += text.slice(i, span.end);
        i = span.end;
        continue;
      }

      out += this.startsWithToken(text, i + 1, tokens) ? "''" : "'";
      i += 1;
    }

    return out;
  }

  /**
   * `text[start]` is an apostrophe immediately followed by `{`, `}` or `#`.
   * Returns the end index of a genuine, self-contained quoted span starting
   * there (its content never reaching one of our placeholders), or `null`.
   */
  private matchQuotedSpan(
    text: string,
    start: number,
    tokens: ReadonlySet<string>,
  ): { end: number } | null {
    let j = start + 1;
    while (j < text.length) {
      if (this.startsWithToken(text, j, tokens)) {
        return null;
      }
      if (text[j] === "'") {
        if (text[j + 1] === "'") {
          // An escaped literal apostrophe inside the quote: skip both
          // characters and keep looking for the real close.
          j += 2;
          continue;
        }

        return { end: j + 1 };
      }
      j += 1;
    }

    return null;
  }

  private startsWithToken(
    text: string,
    pos: number,
    tokens: ReadonlySet<string>,
  ): boolean {
    for (const token of tokens) {
      if (text.startsWith(token, pos)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Interpolation splices raw param text into the message before it is
   * compiled, so a value like `{1234-5678}` is parsed as ICU syntax (#898).
   * String params containing `{` or `}` are swapped for ICU arguments
   * (`{__translocoParamN}`) and their raw values are passed to the compiled
   * message instead, so they always render as literal text.
   *
   * `value` (the template these params interpolate into) is used only to
   * keep generated names from colliding with identical-looking text already
   * in the message (see nextName below); every param is still walked and
   * protected regardless of whether `value` actually references it, since a
   * *referenced translation* reached through it (a `translation[key]`
   * fallback DefaultTranspiler resolves internally) can reference a param
   * this template's own markers never mention.
   *
   * Returns `[paramsToInterpolate, argsForMessage, generatedTokens]`. The
   * first two are `params` itself when nothing needs protecting, and
   * `generatedTokens` (the exact `{name}` strings produced) is then empty,
   * so the common path is unchanged and does no placeholder-related work.
   *
   * Two known limits, both requiring the raw value at a point this method
   * cannot reach without controlling DefaultTranspiler's own splicing:
   * - A custom formatter (`{name, someFormatter}`) reached through a
   *   referenced translation key (`{{ ref }}` resolving to a translation
   *   that itself uses `name`) receives the placeholder, not the raw value,
   *   since DefaultTranspiler's recursion for that lookup carries these
   *   already-protected params down with it. Needs the same param used both
   *   directly and through a formatter in one `translate()` call.
   * - A placeholder landing *inside* an existing ICU quoted span that both
   *   opens and closes around it (`'{ {{ name }} }'`, escaping literal
   *   braces) stays quoted, unresolved, literal text. escapeApostrophes...
   *   below only rescues the narrower case where the value sits directly
   *   against a quote's apostrophe (`'{x}'{{ name }}`, or `l'{{ item }}`
   *   turning into an unintended one) - a span that already fully encloses
   *   the splice point needs each occurrence resolved before its surrounding
   *   text is known to be quoted, which means not delegating the splicing
   *   to `super.transpile()` at all.
   * Both need the same param interpolated once as plain text and once
   * through machinery that only sees the final, spliced string - unusual in
   * practice, and not what issue #898 itself asks for.
   */
  private protectParams(
    value: unknown,
    params: Params | undefined,
  ): [Params, Params, ReadonlySet<string>] {
    // Object translations (translateObject) can pass an entry with no
    // params of its own; DefaultTranspiler itself defaults this the same
    // way (`params = {}` in transpile()'s destructuring).
    const rawParams: Params = params ?? {};
    const placeholders: Record<string, string> = {};
    const reserved = new Set(Object.keys(rawParams));
    const templateText = isString(value) ? value : '';
    // Local, and reset for every call: placeholder names only need to be
    // unique within THIS interpolation, not across the transpiler's
    // lifetime. A never-resetting counter would make the same translate()
    // call compile to different text each time, defeating messageFormat's
    // compiled-message cache (keyed on that text).
    let seq = 0;
    const nextName = (): string => {
      let name: string;
      do {
        name = `${MF_ARG_PREFIX}${seq++}`;
        // Also checked against the message text itself, not just param
        // keys: hand-authored text can otherwise coincidentally match a
        // generated name and be mistaken for a placeholder we inserted -
        // and checked as the bare name, not the exact `{name}` spelling,
        // since ICU allows whitespace and a formatting suffix inside the
        // braces (`{ __translocoParam0 }`, `{__translocoParam0, number}`);
        // a name this specific is never going to appear in hand-authored
        // text any other way.
      } while (reserved.has(name) || templateText.includes(name));

      return name;
    };
    const safeParams = this.toPlaceholders(
      rawParams,
      placeholders,
      nextName,
      new WeakMap(),
      new WeakMap(),
    );

    const names = Object.keys(placeholders);
    // Checked on `placeholders`, not on `safeParams === rawParams`: a nested
    // transpile() (a referenced translation key) can re-protect a value that
    // is already a placeholder (`{__translocoParam0}`), and since names are
    // assigned fresh per call it can come out textually identical to the
    // input, which would make a reference/value check miss the swap.
    return names.length === 0
      ? [rawParams, rawParams, EMPTY_TOKENS]
      : [
          safeParams as Params,
          { ...rawParams, ...placeholders },
          new Set(names.map((name) => `{${name}}`)),
        ];
  }

  private toPlaceholders(
    value: unknown,
    placeholders: Record<string, string>,
    nextName: () => string,
    inProgress: WeakMap<object, ParamsNode | null>,
    memo: WeakMap<object, unknown>,
  ): unknown {
    if (isString(value)) {
      if (!PROTECT_CHARS.test(value)) {
        return value;
      }
      const name = nextName();
      placeholders[name] = value;

      return `{${name}}`;
    }

    if (!Array.isArray(value) && !isPlainObject(value)) {
      return value;
    }

    // A sibling that aliases an already-finished object (shared, but not
    // circular, e.g. two keys pointing at the same nested object) reuses
    // its result instead of re-walking the whole subtree: without this, a
    // graph that fans out into the same shared node from both branches at
    // every level re-traverses that node once per remaining level, turning
    // a graph of N objects into O(2^N) work.
    if (memo.has(value)) {
      return memo.get(value);
    }
    // A param object that (directly or indirectly) contains itself would
    // otherwise recurse forever. Where it re-appears, hand out the copy the
    // walk further up is building instead of the original, so a value
    // protected there is also protected when reached back round the cycle
    // (`user.self.id`), rather than read raw off the original object.
    if (inProgress.has(value)) {
      return this.copyOf(value as ParamsNode, inProgress);
    }
    inProgress.set(value, null);

    // Copy on write: keep the original reference when nothing changed.
    Object.keys(value).forEach((k) => {
      const original = (value as Record<string, unknown>)[k];
      const replaced = this.toPlaceholders(
        original,
        placeholders,
        nextName,
        inProgress,
        memo,
      );
      if (replaced !== original) {
        const copy = this.copyOf(value as ParamsNode, inProgress);
        (copy as Record<string, unknown>)[k] = replaced;
      }
    });
    const result = inProgress.get(value) ?? value;
    inProgress.delete(value);
    memo.set(value, result);

    return result;
  }

  /**
   * The one copy of an object still being walked, created on first need -
   * its first changed entry or the first circular reference back to it - so
   * the walk's result and every back-reference share the same object.
   */
  private copyOf(
    value: ParamsNode,
    inProgress: WeakMap<object, ParamsNode | null>,
  ): ParamsNode {
    let copy = inProgress.get(value);
    if (!copy) {
      copy = Array.isArray(value) ? [...value] : { ...value };
      inProgress.set(value, copy);
    }

    return copy;
  }
}
