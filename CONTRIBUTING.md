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

## Contributing to the Documentation

The Transloco documentation is hosted on GitBook and managed in the `gitbook-docs` branch.

### Steps to Contribute:

1. **Ensure you are working with the `gitbook-docs`**

2. **Install Dependencies**  
   Run the following commands to install the required dependencies:

   ```bash
   npm i
   yarn
   ```

3. **Make Your Changes**  
   Edit or add documentation files located in the `gitbook-docs` branch.

4. **Preview Your Changes**  
   Use GitBook CLI or relevant tools to preview the documentation locally if needed.

5. **Submit a Pull Request**  
   Once your changes are complete, push your branch and open a PR to the `gitbook-docs` branch. Make sure to clearly describe the changes in the PR description.

We welcome contributions that improve clarity, fix typos, add examples, or enhance the existing content!

## Coding Rules

To ensure consistency throughout the source code, keep these rules in mind as you are working:

- All features or bug fixes **must be tested** by one or more specs (unit-tests).
- All public API methods **must be documented**.

## Commit Message Guidelines

We have very precise rules over how our git commit messages can be formatted. This leads to **more
readable messages** that are easy to follow when looking through the **project history**. But also,
we use the git commit messages to **generate the changelog**.

### Commit Message Format

All commits must be committed using the `commit` script:

```bash
npm run commit
yarn commit
```

Choose the correct package you are making the changes for. If this is a repository-level change, you can choose the first (empty) option.

**Important:** Only put something in the `BREAKING CHANGES` prompt if you actually made a breaking change; no need to answer it with "no."
