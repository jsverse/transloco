# Contributing to Transloco

🙏 We would ❤️ for you to contribute to Transloco and help make it even better than it is today!

# Developing

Start by installing all dependencies:

```bash
npm i
yarn
```

The Transloco project is a monorepo managed by nx with the following structure:

Packages:

- transloco
- transloco-locale
- transloco-messageformat
- transloco-optimize
- transloco-presist-lang
- transloco-presist-translations
- transloco-preload-langs
- transloco-schematics
- transloco-utils
- transloco-validator

Apps:

- transloco-playground
- transloco-playground-e2e (cypress)

Run the tests:

```bash
nx test [package-name]
nx e2e transloco-playground-e2e
```

Run the playground app:

```bash
npm start
```

## Building

```bash
npm run build:[package]
```

Note: Don't use nx directly as some apps might have further building steps

## <a name="rules"></a> Coding Rules

To ensure consistency throughout the source code, keep these rules in mind as you are working:

- All features or bug fixes **must be tested** by one or more specs (unit-tests).
- All public API methods **must be documented**.

## <a name="commit"></a> Commit Message Guidelines

We have very precise rules over how our git commit messages can be formatted. This leads to **more
readable messages** that are easy to follow when looking through the **project history**. But also,
we use the git commit messages to **generate the changelog**.

### Commit Message Format

All commits must be committed using the `commit` script:

```bash
npm run commit
yarn commit
```

Choose the correct package you are making the changes for, if this is a repository level change
you can choose the first (empty) option.

**Important:** Only put something in the `BREAKING CHANGES` prompt if you actually made a breaking change, no need ot answer it with "no".
