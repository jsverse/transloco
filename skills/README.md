# Transloco Agent Skills

[Agent Skills](https://skills.sh/) that teach AI coding agents how to work with [Transloco](https://github.com/jsverse/transloco), the internationalization (i18n) library for Angular. Each skill provides actionable, version-aware guidance grounded in this repository's source code and documentation (`docs/`, `BREAKING_CHANGES.md`) — not a generic documentation dump.

## Available Skills

| Skill                                                | Responsible for                                                                                                                                                              | Not responsible for                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`transloco-core`](./transloco-core)                 | Everyday API usage: `TranslocoService`, the structural directive/pipe/attribute directive, signals (`translateSignal`), config, scopes & lazy loading, testing, SSR caveats. | Plugins, migrations, key extraction — see below. |
| [`transloco-plugins`](./transloco-plugins)           | Official `@jsverse/transloco-*` plugins: locale (l10n), messageformat (ICU), persist-lang, persist-translations, preload-langs, validator, optimize, scoped-libs.            | Core translation API.                            |
| [`transloco-migration`](./transloco-migration)       | Migrating from ngx-translate / Angular's built-in i18n, and upgrading between Transloco major versions (e.g. the v8→v9 breaking changes).                                    | Day-to-day usage once on the target version.     |
| [`transloco-keys-manager`](./transloco-keys-manager) | The Keys Manager (TKM) CLI: extracting translation keys from code/templates, finding missing/unused keys, marker function, extraction comments.                              | Runtime translation behavior.                    |

## Architecture

Each skill is a self-contained directory following the [`skills` CLI](https://github.com/vercel-labs/skills) discovery convention (`skills/<name>/SKILL.md`):

```text
skills/
├── transloco-core/
│   ├── SKILL.md              # decision rules & API overview, kept short
│   └── references/           # deep-dive docs, loaded by the agent on demand
│       ├── config.md
│       ├── template-apis.md
│       ├── scopes-and-loaders.md
│       └── testing-and-ssr.md
├── transloco-plugins/
│   ├── SKILL.md               # one-row-per-plugin index
│   └── references/            # one file per plugin
│       ├── locale.md
│       ├── messageformat.md
│       ├── persist-lang.md
│       ├── persist-translations.md
│       ├── preload-langs.md
│       ├── validator.md
│       ├── optimize.md
│       └── scoped-libs.md
├── transloco-migration/
│   └── SKILL.md                # single file: ngx-translate, Angular i18n, v8→v9
└── transloco-keys-manager/
    └── SKILL.md                # single file: extract/find CLI workflow
```

**Design principles:**

- `SKILL.md` stays short and rule-based ("prefer X over Y", "don't do X unless Y") so it's cheap for an agent to load every time the skill triggers.
- Deeper, less frequently needed detail lives in `references/*.md`, linked from `SKILL.md`, and loaded only when relevant.
- Content transforms documentation into instructions rather than duplicating it — no API is documented here that isn't backed by this repo's source or `docs/`.
- `transloco-core` explicitly instructs agents to check the project's installed `@jsverse/transloco` / `@angular/core` versions before generating code, since the API differs across major versions (see the compatibility table in `transloco-core/SKILL.md`).

## Installing

```bash
# All skills
npx skills add https://github.com/jsverse/transloco

# A single skill
npx skills add jsverse/transloco --skill transloco-core
```

## Maintaining

When Transloco's public API changes:

1. Update the relevant `docs/v*` page(s) as usual.
2. Update the matching `SKILL.md` / `references/*.md` file(s) in the same PR, especially the version-compatibility table in `transloco-core/SKILL.md` and the upgrade steps in `transloco-migration/SKILL.md`.
3. Keep `SKILL.md` files focused on rules an agent should follow; move prose/background explanation to `references/`.
