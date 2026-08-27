/**
 * Builds the Discord webhook payload announcing a release.
 *
 * Kept pure so it can be tested without a webhook — `announce-release.mts` does the I/O.
 */

/** Discord caps an embed description at 4096 characters; the rest is the wrapper. */
const MAX_NOTES = 1400;

const STABLE = 0x2ecc71;
const PRERELEASE = 0xe67e22;

export interface Release {
  version: string;
  /** `owner/repo` */
  repo: string;
  /** Release notes; empty is fine, the links carry the message on their own. */
  notes: string;
}

/** Spread, not `slice`: indexing by code point never splits an emoji in half. */
function truncate(notes: string): string {
  const codePoints = [...notes];
  return codePoints.length > MAX_NOTES
    ? `${codePoints.slice(0, MAX_NOTES).join('')}…`
    : notes;
}

export function buildAnnouncement({ version, repo, notes }: Release) {
  const isPrerelease = version.includes('-');
  const distTag = isPrerelease ? 'next' : 'latest';

  // The tag pattern is `releases/{version}`, so the permalink doubles that segment.
  const releaseUrl = `https://github.com/${repo}/releases/tag/releases/${version}`;
  const changelogUrl = `https://github.com/${repo}/blob/master/CHANGELOG.md`;
  const npmUrl = `https://www.npmjs.com/package/@jsverse/transloco/v/${version}`;

  return {
    username: 'Transloco',
    embeds: [
      {
        title: isPrerelease
          ? `🧪 @jsverse/transloco v${version} · prerelease`
          : `🎉 @jsverse/transloco v${version}`,
        url: releaseUrl,
        color: isPrerelease ? PRERELEASE : STABLE,
        description: [
          '```bash',
          `npm i @jsverse/transloco@${distTag}`,
          '```',
          truncate(notes),
          '',
          `[Release notes](${releaseUrl}) · [Changelog](${changelogUrl}) · [npm](${npmUrl})`,
        ].join('\n'),
        fields: [
          { name: 'npm dist-tag', value: `\`${distTag}\``, inline: true },
        ],
      },
    ],
  };
}
