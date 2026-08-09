import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

/** Node major required by the CLI packages as of v9 (was `>=18`). */
const REQUIRED_NODE_MAJOR = 22;

/** Angular major required by the Angular packages as of v9 (was `>=16`). */
const REQUIRED_ANGULAR_MAJOR = 20;

/** The CLI packages whose `engines.node` moved to `>=22`. */
const NODE_PACKAGES = [
  '@jsverse/transloco-optimize',
  '@jsverse/transloco-scoped-libs',
  '@jsverse/transloco-utils',
  '@jsverse/transloco-validator',
];

function readMajor(range: string | undefined): number | null {
  const match = range?.match(/(\d+)\s*\./);

  return match ? Number(match[1]) : null;
}

/**
 * Reports the v9 breaking changes that can't be applied to the source tree.
 * The Angular check is informational - `ng update` already refuses on an
 * unsatisfiable peer - but it never inspects `engines`, so Node is on us.
 */
export function reportVersionFloors(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const nodeMajor = Number(process.versions.node.split('.')[0]);
    if (nodeMajor < REQUIRED_NODE_MAJOR) {
      context.logger.warn(
        `  ↳ Node ${nodeMajor} detected. The Transloco CLI packages now require Node >=${REQUIRED_NODE_MAJOR}:\n` +
          `    ${NODE_PACKAGES.join(', ')}.\n` +
          `    chokidar was also bumped 3 -> 5 (ESM-only) in transloco-scoped-libs.`,
      );
    }

    const buffer = tree.read('/package.json');
    if (!buffer) return;

    let packageJson: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    try {
      packageJson = JSON.parse(buffer.toString());
    } catch {
      return;
    }

    const deps = {
      ...packageJson.devDependencies,
      ...packageJson.dependencies,
    };

    const angularMajor = readMajor(deps['@angular/core']);
    if (angularMajor !== null && angularMajor < REQUIRED_ANGULAR_MAJOR) {
      context.logger.warn(
        `  ↳ @angular/core ${angularMajor} detected. Transloco v9 requires Angular >=${REQUIRED_ANGULAR_MAJOR}.\n` +
          `    Run "ng update @angular/core @angular/cli" first.`,
      );
    }
  };
}
