import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

/** Node major required by the CLI packages as of v9 (was `>=18`). */
const REQUIRED_NODE_MAJOR = 22;

/** The CLI packages whose `engines.node` moved to `>=22`. */
const NODE_PACKAGES = [
  '@jsverse/transloco-keys-manager',
  '@jsverse/transloco-optimize',
  '@jsverse/transloco-scoped-libs',
  '@jsverse/transloco-utils',
  '@jsverse/transloco-validator',
];

/** Range of the packages that read the Transloco config through cosmiconfig 10. */
const TYPE_STRIPPING_RANGE = '^22.18.0 || >=24';

/** The CLI packages whose `engines.node` moved to {@link TYPE_STRIPPING_RANGE}. */
const TYPE_STRIPPING_PACKAGES = [
  '@jsverse/transloco-keys-manager',
  '@jsverse/transloco-scoped-libs',
  '@jsverse/transloco-utils',
];

/**
 * The warnings a Node `version` gets against the v9 floors, if any.
 *
 * cosmiconfig 10 loads TS configs with Node's own type stripping, unflagged
 * from 22.18 on, and declares 23 unsupported - hence the range rather than a
 * major.
 */
export function findVersionFloorWarnings(version: string): string[] {
  const [major, minor] = version.split('.').map(Number);

  if (major < REQUIRED_NODE_MAJOR) {
    return [
      `  ↳ Node ${version} detected. The Transloco CLI packages now require Node >=${REQUIRED_NODE_MAJOR}:\n` +
        `    ${NODE_PACKAGES.join(', ')}.\n` +
        `    chokidar was also bumped 3 -> 5 (ESM-only) in transloco-scoped-libs.`,
    ];
  }

  const stripsTypes = major >= 24 || (major === 22 && minor >= 18);
  if (stripsTypes) return [];

  return [
    `  ↳ Node ${version} detected. These packages now require Node ${TYPE_STRIPPING_RANGE}:\n` +
      `    ${TYPE_STRIPPING_PACKAGES.join(', ')}.\n` +
      `    They load TS Transloco configs through cosmiconfig 10, which relies on Node's type stripping.`,
  ];
}

/**
 * Reports the v9 breaking changes that can't be applied to the source tree.
 *
 * Only Node is checked here. The Angular floor is declared instead - as a peer
 * range, and as `requires` on the migration itself - which is how the rest of
 * the ecosystem does it: `ng update` refuses on an unsatisfiable peer before
 * any migration runs, and Nx evaluates `requires` itself. Parsing a version
 * range by hand would only duplicate that, less reliably.
 *
 * Node has no such mechanism. `engines.node` is a warning under npm rather than
 * a refusal, and it states intent rather than the interpreter actually running,
 * so this reads the live version.
 */
export function reportVersionFloors(): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    for (const warning of findVersionFloorWarnings(process.versions.node)) {
      context.logger.warn(warning);
    }
  };
}
