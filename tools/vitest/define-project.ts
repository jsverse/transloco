import { defineConfig, mergeConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

import { baseConfig } from './vitest.base';

/**
 * Shared factory for per-project Vitest configs. Every project merges the base
 * config (see vitest.base.ts) and then layers on the handful of things it
 * actually owns. Centralizing the jsdom/Angular vs. node boilerplate here keeps
 * the per-project files to a single declarative call and prevents drift (e.g. a
 * jsdom project silently forgetting its Angular `setupFiles`).
 */
export interface ProjectOptions {
  /** Vitest project name, shown in reporters. */
  name: string;
  /** The project directory — always pass `__dirname`. */
  root: string;
  /** Coverage output dir, relative to `root` (e.g. '../../coverage/libs/foo'). */
  coverageDir: string;
  /** Spec glob(s), relative to `root`. Defaults to 'src/**\/*.spec.ts'. */
  include?: string[];
  /** Setup files, relative to `root`. */
  setupFiles?: string[];
  /** Override the base's `restoreMocks: true` (e.g. beforeAll spies). */
  restoreMocks?: boolean;
  /** Extra coverage `include` globs. */
  coverageInclude?: string[];
  /** Extra coverage `exclude` globs. */
  coverageExclude?: string[];
}

function buildProject(
  opts: ProjectOptions,
  extra: { environment: 'jsdom' | 'node'; plugins?: unknown[] },
) {
  const {
    name,
    root,
    coverageDir,
    include = ['src/**/*.spec.ts'],
    setupFiles,
    restoreMocks,
    coverageInclude,
    coverageExclude,
  } = opts;

  return mergeConfig(
    baseConfig,
    defineConfig({
      root,
      ...(extra.plugins ? { plugins: extra.plugins as never } : {}),
      test: {
        name,
        environment: extra.environment,
        include,
        ...(setupFiles ? { setupFiles } : {}),
        ...(restoreMocks !== undefined ? { restoreMocks } : {}),
        coverage: {
          reportsDirectory: coverageDir,
          ...(coverageInclude ? { include: coverageInclude } : {}),
          ...(coverageExclude ? { exclude: coverageExclude } : {}),
        },
      },
    }),
  );
}

/**
 * jsdom + Angular project. Always wires the shared Angular setup file (zone.js +
 * TestBed init), so a project can never accidentally run TestBed/spectator specs
 * without it.
 */
export function defineAngularProject(opts: ProjectOptions) {
  return buildProject(
    {
      ...opts,
      setupFiles: [
        '../../tools/vitest/setup-angular.ts',
        ...(opts.setupFiles ?? []),
      ],
    },
    { environment: 'jsdom', plugins: [angular()] },
  );
}

/** Node-environment project (CLI/utility libs, schematics). */
export function defineNodeProject(opts: ProjectOptions) {
  return buildProject(opts, { environment: 'node' });
}
