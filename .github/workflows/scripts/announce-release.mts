/**
 * Announces a release in the Discord #releases channel.
 *
 * Run by `.github/workflows/release.yml` as `node .github/workflows/scripts/announce-release.mts`,
 * matching how the other `*.mts` scripts are invoked — Node strips the types, so there is
 * nothing to install and no loader to configure.
 *
 * Best-effort: by the time this runs the release is already published and tagged, so no
 * failure here may take the release down with it. The workflow step is continue-on-error.
 */
import { buildAnnouncement } from './release-embed.mts';

const API = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const webhook = process.env.DISCORD_WEBHOOK;
const version = process.env.VERSION;
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;

/** The notes are a bonus; on any failure the embed still carries the links. */
async function releaseNotes(): Promise<string> {
  try {
    const response = await fetch(
      `${API}/repos/${repo}/releases/tags/releases/${version}`,
      {
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'x-github-api-version': '2022-11-28',
        },
      },
    );
    if (!response.ok) {
      console.log(
        `::warning::Could not read the release notes (${response.status}).`,
      );
      return '';
    }
    const release = (await response.json()) as { body?: string | null };
    return release.body ?? '';
  } catch {
    console.log('::warning::Could not read the release notes.');
    return '';
  }
}

async function main(): Promise<void> {
  if (!webhook) {
    console.log(
      '::notice::DISCORD_RELEASES_WEBHOOK is not set; skipping the announcement.',
    );
    return;
  }
  if (!version || !repo) {
    throw new Error('VERSION and GITHUB_REPOSITORY must both be set');
  }

  const payload = buildAnnouncement({
    version,
    repo,
    notes: await releaseNotes(),
  });

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      `Discord returned ${response.status}: ${await response.text()}`,
    );
  }
  console.log(`Announced v${version} in Discord.`);
}

main().catch((error) => {
  console.log(
    `::warning::Discord announcement failed: ${error instanceof Error ? error.message : String(error)}. The release itself succeeded.`,
  );
  process.exitCode = 1;
});
