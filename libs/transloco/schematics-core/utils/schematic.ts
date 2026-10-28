export const NAMES = {
  LIB_NAME: '@jsverse/transloco',
  CONFIG_FILE: 'transloco.config.ts',
};

/**
 * What the schematics put in a new config file. The generated file types it as
 * `TranslocoGlobalConfig` from `@jsverse/transloco`, which the schematics can't
 * import: this folder is compiled to CommonJS, outside the package's own build.
 */
interface GeneratedConfig {
  rootTranslationsPath?: string;
  langs?: string[];
  keysManager?: Record<string, never>;
}

const identifier = /^[A-Za-z_$][\w$]*$/;

const escapeControl = (char: string) =>
  ({ '\n': '\\n', '\r': '\\r', '\t': '\\t' })[char] ??
  `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;

/** A string literal the way Prettier writes it, in single quotes. */
const quote = (value: string) =>
  `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/[\p{Cc}\u2028\u2029]/gu, escapeControl)}'`;

/**
 * Serializes a config value the way the Angular CLI's Prettier pass leaves it:
 * single quotes, trailing commas, one property per line, and arrays on one line
 * while they fit in 80 columns.
 */
function serialize(
  value: unknown,
  indent: string,
  prefixLength: number,
): string {
  if (typeof value === 'string') {
    return quote(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => serialize(item, `${indent}  `, 0));
    const oneLine = `[${items.join(', ')}]`;
    if (
      !items.some((item) => item.includes('\n')) &&
      indent.length + prefixLength + oneLine.length + 1 <= 80
    ) {
      return oneLine;
    }

    return `[\n${items.map((item) => `${indent}  ${item},\n`).join('')}${indent}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) {
      return '{}';
    }
    const inner = `${indent}  `;
    const props = entries.map(([key, item]) => {
      const name = identifier.test(key) ? key : quote(key);

      return `${inner}${name}: ${serialize(item, inner, name.length + 3)},\n`;
    });

    return `{\n${props.join('')}${indent}}`;
  }

  return String(value);
}

export function generateConfigFile(config: GeneratedConfig) {
  return `import type { TranslocoGlobalConfig } from '@jsverse/transloco';

const config: TranslocoGlobalConfig = ${serialize(config, '', 0)};

export default config;
`;
}
