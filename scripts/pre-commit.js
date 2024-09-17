const { execSync } = require('child_process');
const chalk = require('chalk');

const fileExtensions = {
  ts: /\.ts$/,
  spec: /\.spec\.ts$/,
};

/** Map of forbidden words and their match regex */
const words = {
  debugger: { matcher: '(debugger);?', extension: fileExtensions.ts },
  fit: { matcher: '\\s*fit\\(', extension: fileExtensions.spec },
  '.skip': { matcher: '\\.skip\\(', extension: fileExtensions.spec },
  '.only': { matcher: '\\.only\\(', extension: fileExtensions.spec },
  fdescribe: { matcher: '\\s*fdescribe\\(', extension: fileExtensions.spec },
};

let status = 0;
for (let [word, { extension, matcher }] of Object.entries(words)) {
  const gitCommand = `git diff --staged -G"${matcher}" --name-only`;
  const failedFiles = execSync(gitCommand).toString();
  const filesAsArray = failedFiles.split('\n');
  const supportedFiles = filesAsArray.filter((file) =>
    extension.test(file.trim()),
  );

  if (supportedFiles.length) {
    status = 1;
    console.log(
      chalk.bgRed.whiteBright('Error:'),
      `The following files contains '${word}' in them:`,
    );
    console.log(chalk.white(supportedFiles.join('\n')));
  }
}
process.exit(status);
