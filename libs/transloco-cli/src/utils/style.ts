import { styleText } from 'node:util';

type Format = Parameters<typeof styleText>[0];

/**
 * Styles what a command prints to stdout.
 *
 * Several values are joined with a space, and the style is closed before every
 * line break and opened again after it, so a line of a longer message never
 * leaves its style behind. Whether stdout takes styles at all is decided by
 * `styleText`: not when it's piped, unless `FORCE_COLOR` says otherwise.
 */
export function style(format: Format, ...values: unknown[]) {
  const text = values.length === 1 ? String(values[0]) : values.join(' ');

  if (!text) return '';

  return text
    .split(/(\r?\n)/)
    .map((part, index) =>
      index % 2 ? part : styleText(format, part, { stream: process.stdout }),
    )
    .join('');
}
