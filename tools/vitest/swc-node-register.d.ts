// @swc-node/register exposes these subpath entry points at runtime, but its
// package.json `exports` map declares no `types` condition for them, so
// TypeScript (bundler resolution) cannot locate the shipped declarations.
// Declare the minimal surface used by setup-schematics.ts.
declare module '@swc-node/register/read-default-tsconfig' {
  import type * as ts from 'typescript';
  export function readDefaultTsConfig(
    tsConfigPath?: string,
  ): Partial<ts.CompilerOptions> & { fallbackToTs?: (path: string) => boolean };
}

declare module '@swc-node/register/register' {
  import type * as ts from 'typescript';
  export function register(options?: Partial<ts.CompilerOptions>): void;
}
