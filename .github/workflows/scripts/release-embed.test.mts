/**
 * Run with: node --test .github/workflows/scripts/release-embed.test.mts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

import { buildAnnouncement } from './release-embed.mts';

const repo = 'jsverse/transloco';

const embedOf = (version: string, notes = '') =>
  buildAnnouncement({ version, repo, notes }).embeds[0];

describe('buildAnnouncement', () => {
  it('given a stable version, then it announces the latest dist-tag', () => {
    const embed = embedOf('9.0.0');

    assert.equal(embed.title, '🎉 @jsverse/transloco v9.0.0');
    assert.equal(embed.color, 0x2ecc71);
    assert.equal(embed.fields[0].value, '`latest`');
    assert.match(embed.description, /npm i @jsverse\/transloco@latest/);
  });

  it('given a prerelease version, then it announces the next dist-tag and is visually distinct', () => {
    const embed = embedOf('9.0.0-alpha.1');

    assert.equal(
      embed.title,
      '🧪 @jsverse/transloco v9.0.0-alpha.1 · prerelease',
    );
    assert.notEqual(embed.color, embedOf('9.0.0').color);
    assert.equal(embed.fields[0].value, '`next`');
    assert.match(embed.description, /npm i @jsverse\/transloco@next/);
  });

  // The tag is `releases/{version}`, so the permalink doubles that segment — writing the
  // more natural /releases/tag/v9.0.0 ships a dead link.
  it('given any version, then the release url keeps the doubled releases segment', () => {
    assert.equal(
      embedOf('9.0.0').url,
      'https://github.com/jsverse/transloco/releases/tag/releases/9.0.0',
    );
  });

  it('given notes, then they sit between the install block and the links', () => {
    const embed = embedOf(
      '9.0.0',
      '### 🚀 Features\n\n- **transloco:** signals',
    );

    assert.equal(
      embed.description,
      '```bash\n' +
        'npm i @jsverse/transloco@latest\n' +
        '```\n' +
        '### 🚀 Features\n\n- **transloco:** signals\n' +
        '\n' +
        '[Release notes](https://github.com/jsverse/transloco/releases/tag/releases/9.0.0)' +
        ' · [Changelog](https://github.com/jsverse/transloco/blob/master/CHANGELOG.md)' +
        ' · [npm](https://www.npmjs.com/package/@jsverse/transloco/v/9.0.0)',
    );
  });

  it('given no notes, then the embed still carries the links', () => {
    const embed = embedOf('9.0.0');

    assert.match(embed.description, /\[Release notes\]/);
    assert.ok(embed.description.length < 4096);
  });

  it('given notes hostile to JSON, then the payload survives a round trip', () => {
    const notes = '- **transloco:** a "quoted" \\ backslashed 🚀 line';
    const payload = buildAnnouncement({ version: '9.0.0', repo, notes });

    const roundTripped = JSON.parse(JSON.stringify(payload));
    assert.match(
      roundTripped.embeds[0].description,
      /a "quoted" \\ backslashed 🚀/,
    );
  });

  it('given oversized notes, then the description stays inside the Discord limit', () => {
    const notes = '🚀 a long emoji-laden release note line\n'.repeat(200);
    const embed = embedOf('9.0.0', notes);

    assert.ok(embed.description.length < 4096);
    assert.match(embed.description, /…/);
    // Truncating by code point must not leave half an emoji behind.
    assert.ok(embed.description.isWellFormed());
  });
});
