---
name: create-pr
description: "Name branches correctly and create a pull request for the current branch in the Transloco repo. Use when the user asks to 'create a branch', 'name my branch', 'create a PR', 'open a pull request', or 'submit a PR'. Enforces the branch-naming convention, derives a conventional-commit PR title (type(scope): description), fills in .github/pull_request_template.md, and auto-applies matching repo labels."
---

# Name Branches & Create PRs (Transloco)

## When to Use

- The user wants help naming a new branch before starting work.
- The user asks to create/open/submit a pull request for the current branch.

This skill enforces the branch-naming convention and the commit/PR rules from
`CONTRIBUTING.md` and `commitlint.config.js`.

## Branch Naming Convention

```
<prefix>/<scope>-<kebab-case-description>
<prefix>/<kebab-case-description>            (no scope, for repo-wide changes)
```

- `<prefix>`: one of `feature`, `tech`, `bug`, `release`, `hotfix`, `e2e`
- `<scope>`: optional, a package/library scope (see **Scopes** below). Omit it for
  changes that aren't tied to one package (root config, CI, docs, monorepo tooling).
- `<kebab-case-description>`: short, human-readable summary of the change.

### Prefix meaning & matching commit type

| Branch prefix | Use for                                   | Commit/PR type |
| -------------- | ------------------------------------------ | -------------- |
| `feature`      | New functionality                           | `feat`         |
| `bug`          | Bug fix                                     | `fix`          |
| `hotfix`       | Urgent production fix                       | `fix`          |
| `tech`         | Refactors, tooling, chores, deps            | `chore` (or `refactor`/`build`/`ci` if clearly a better fit) |
| `release`      | Release preparation                         | `chore`        |
| `e2e`          | Playwright e2e-only changes                 | `test`         |

`commitlint.config.js` only allows these commit types: `build`, `chore`, `ci`, `docs`,
`feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`, `plugin`. Always pick from
this list.

### Scopes

Scope is the package name, without the `transloco-` prefix (matches `libs/` folder
names and commit-message convention):

`transloco` (core, no suffix), `locale`, `messageformat`, `optimize`, `persist-lang`,
`persist-translations`, `preload-langs`, `scoped-libs`, `keys-manager`, `schematics`,
`utils`, `validator`

### Examples

| Branch                                                | PR/commit title                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `bug/locale-drop-conflicting-date-options`              | `fix(locale): drop conflicting date options when merging the global config`   |
| `feature/keys-manager-support-yaml-output`              | `feat(keys-manager): support yaml output`                                     |
| `tech/persist-lang-upgrade-nx`                          | `chore(persist-lang): upgrade nx`                                             |
| `tech/upgrade-nx` (root-level, no single package scope) | `chore: upgrade nx`                                                           |
| `e2e/scoped-libs-stabilize-lazy-load-scenario`          | `test(scoped-libs): stabilize lazy load scenario`                             |

## Procedure

### 1. Naming a new branch (if that's what's being asked)

- Ask (or infer from context) what the change is about, pick the right `<prefix>`
  from the table above, determine the `<scope>` (or omit it), and propose the
  `<prefix>/<scope>-<description>` branch name. Create it with
  `git checkout -b <name>` once confirmed.

### 2. Creating a PR

1. **Commit any pending work first**

   - Check `git status --porcelain`. If there are staged/unstaged/untracked changes,
     stage everything (`git add -A`).
   - Determine `<type>` and `<scope>` (see below), then commit with:
     `<type>(<scope>): <description>` — generated from the actual diff content, not a
     generic message. Omit `(<scope>)` if no single package scope applies.
   - Follow `CONTRIBUTING.md`: this is the same format produced by `npm run commit`.

2. **Determine `<type>`** from the current branch's `<prefix>` using the mapping
   table above.

3. **Determine `<scope>`**

   - Prefer the scope encoded in the branch name (the segment right after
     `<prefix>/`), if it matches one of the known scopes.
   - Otherwise, infer it from the changed files vs. the base branch
     (`git diff --name-only master...HEAD`): `libs/transloco-<scope>/` maps to
     `<scope>`; `libs/transloco/` maps to `transloco`.
   - If changes span multiple packages, or touch only root/shared files, omit the
     scope entirely — don't force one.

4. **Build the PR title**: `<type>(<scope>): <description>`, or `<type>: <description>`
   with no scope. Keep it lowercase after the colon, imperative mood, no trailing period
   (e.g. `fix(locale): drop conflicting date options when merging the global config`).

5. **Check for a related issue** (this repo has no ticket/DevOps system — issues are
   optional and opportunistic):

   - Look for an issue number in the branch name or recent commits.
   - If none is obvious, use `gh issue list --search "<key terms>"` to check for a
     matching open issue. If genuinely unsure, ask the user with `ask_user` whether
     the PR closes a specific issue number; don't fabricate one.
   - If an issue is found, note it as `Closes #<number>`; otherwise leave the
     template's "Issue Number: N/A" as-is.

6. **Fill in `.github/pull_request_template.md`** as the PR body — don't skip or
   replace it:

   - Check the correct **PR Type** box(es) based on the branch prefix (`bug`/`hotfix`
     → Bugfix, `feature` → Feature, `tech` → Refactoring/Build/CI as fitting,
     `release` → Other, `e2e` → Other/Refactoring).
   - Fill in **What is the current behavior?** / **What is the new behavior?** from the
     actual diff, and the **Issue Number** line from step 5.
   - Check the **Does this PR introduce a breaking change?** box truthfully.
   - Leave the checklist items as checkboxes for the author/reviewer to verify (don't
     pre-check tests/docs boxes unless you actually added them in this change).

7. **Push and create the PR**:

   - Push the branch: `git push -u origin <branch>`.
   - Create the PR against `master` with the built title and the filled-in template
     as the body (`gh pr create --title "..." --body-file <file> --base master`).
   - Default to a normal (non-draft) PR; only pass `--draft` if the user explicitly
     asked for a draft.

8. **Apply labels**

   - Fetch current labels and descriptions with `gh label list` (don't hardcode —
     labels and descriptions can change over time).
   - Apply the package label matching `<scope>`, if one exists (e.g. `locale`,
     `keys-manager`, `persist-lang`) — these are named exactly after the scope.
   - Apply a type label only when one clearly matches: `bug`/`hotfix` → `bug`,
     `feature` → `enhancement`. There's no dedicated label for `tech`, `release`,
     `e2e`, or `hotfix` — skip a type label rather than guessing one.
   - Optionally add one `area: <topic>` label, but only when the change content
     clearly matches that label's description with high confidence (e.g. a change to
     the transpiler → `area: transpiler`). Skip it if uncertain.
   - Apply labels with `gh pr edit <number> --add-label "<label1>,<label2>"`.
