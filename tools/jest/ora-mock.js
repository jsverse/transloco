// CJS stub for `ora` (which is pure ESM as of v8+) so Jest's CommonJS test
// runtime can load `@angular-devkit/schematics/testing` without choking on
// `import` syntax. The schematics specs never exercise the spinner, so a no-op
// chainable stub is sufficient.
function createSpinner() {
  const spinner = {
    start() {
      return spinner;
    },
    stop() {
      return spinner;
    },
    succeed() {
      return spinner;
    },
    fail() {
      return spinner;
    },
    warn() {
      return spinner;
    },
    info() {
      return spinner;
    },
    clear() {
      return spinner;
    },
    render() {
      return spinner;
    },
    text: '',
    isSpinning: false,
  };
  return spinner;
}

module.exports = createSpinner;
module.exports.default = createSpinner;
