class TranslocoScopedLibsWebpackPlugin {
  apply() {
    const spawn = require('child_process').spawn;
    spawn('transloco-scoped-libs', ['--watch'], {
      stdio: 'inherit',
      detached: true,
    });
  }
}

module.exports = TranslocoScopedLibsWebpackPlugin;
