import { describe, expect, it } from 'vitest';

import { CliError } from './errors.js';
import { assertKeysManagerPeers } from './peers.js';

function notFound(name: string) {
  return Object.assign(new Error(`Cannot find module '${name}'`), {
    code: 'MODULE_NOT_FOUND',
  });
}

/** A resolver that finds every package but the given ones. */
function resolverMissing(...missing: string[]) {
  return (name: string) => {
    if (missing.includes(name)) {
      throw notFound(name);
    }

    return `/node_modules/${name}/index.js`;
  };
}

function catchError(run: () => void) {
  try {
    run();
  } catch (error) {
    return error;
  }

  return undefined;
}

describe('assertKeysManagerPeers', () => {
  it(`GIVEN both peers are installed
      WHEN they are verified
      THEN nothing is thrown`, () => {
    expect(() =>
      assertKeysManagerPeers('extract', resolverMissing()),
    ).not.toThrow();
  });

  it(`GIVEN the workspace this spec runs in
      WHEN the peers are verified with the default resolver
      THEN both are found from the package itself`, () => {
    expect(() => assertKeysManagerPeers('extract')).not.toThrow();
  });

  it(`GIVEN @angular/compiler is not installed
      WHEN the peers are verified
      THEN it fails naming the package, its supported range and how to install it`, () => {
    const error = catchError(() =>
      assertKeysManagerPeers('extract', resolverMissing('@angular/compiler')),
    );

    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      exitCode: 1,
      message: [
        'error: "transloco extract" needs @angular/compiler, which is not installed.',
        '  @angular/compiler supported range: >= 20.0.0 < 23.0.0',
        'Install it in your project: npm install --save-dev "@angular/compiler@>=20.0.0 <23.0.0"',
      ].join('\n'),
    });
  });

  it(`GIVEN typescript is not installed
      WHEN the peers are verified
      THEN it fails naming the package, its supported range and how to install it`, () => {
    const error = catchError(() =>
      assertKeysManagerPeers('find', resolverMissing('typescript')),
    );

    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      exitCode: 1,
      message: [
        'error: "transloco find" needs typescript, which is not installed.',
        '  typescript supported range: >= 5.8.0 < 7.0.0',
        'Install it in your project: npm install --save-dev "typescript@>=5.8.0 <7.0.0"',
      ].join('\n'),
    });
  });

  it(`GIVEN neither peer is installed
      WHEN the peers are verified
      THEN a single failure names both`, () => {
    const error = catchError(() =>
      assertKeysManagerPeers(
        'find',
        resolverMissing('@angular/compiler', 'typescript'),
      ),
    );

    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      message: [
        'error: "transloco find" needs @angular/compiler and typescript, which are not installed.',
        '  @angular/compiler supported range: >= 20.0.0 < 23.0.0',
        '  typescript supported range: >= 5.8.0 < 7.0.0',
        'Install them in your project: npm install --save-dev "@angular/compiler@>=20.0.0 <23.0.0" "typescript@>=5.8.0 <7.0.0"',
      ].join('\n'),
    });
  });

  it(`GIVEN @jsverse/angular-utils is installed, which needs the compiler itself
      WHEN the peers are verified
      THEN each peer is resolved on its own and nothing is inferred from other packages`, () => {
    const resolved: string[] = [];
    const resolve = (name: string) => {
      resolved.push(name);

      // Everything resolves but the compiler, the way a `--legacy-peer-deps` install leaves it
      if (name === '@angular/compiler') {
        throw notFound(name);
      }

      return name;
    };

    const error = catchError(() => assertKeysManagerPeers('extract', resolve));

    expect(resolved).toEqual(['@angular/compiler', 'typescript']);
    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      message: expect.stringContaining(
        'needs @angular/compiler, which is not installed',
      ),
    });
  });

  it(`GIVEN a peer that is installed but cannot be resolved through require
      WHEN the peers are verified
      THEN it counts as installed`, () => {
    const resolve = (name: string) => {
      if (name === '@angular/compiler') {
        throw Object.assign(new Error('No "exports" main defined'), {
          code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
        });
      }

      return name;
    };

    expect(() => assertKeysManagerPeers('extract', resolve)).not.toThrow();
  });
});
