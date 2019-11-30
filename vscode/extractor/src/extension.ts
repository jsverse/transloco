import * as vscode from 'vscode';
import * as fs from 'fs';

export async function vsConfig() {
  return await vscode.workspace.getConfiguration();
}

export async function getTranlateFiles() {
  const config = await vsConfig();
  const rootTranslationsPath = config.get<string>('translocoExtract.rootTranslationsPath');
  const files = await vscode.workspace.findFiles(rootTranslationsPath!, '{dist,node_modules}');

  return files.map(u => u.fsPath);
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.translocoExtract', async () => {
    const editor = vscode.window.activeTextEditor;
    const config = await vsConfig();

    if (editor) {
      const selection = editor.selection;
      const text = editor.document.getText(editor.selection);

      if (text) {
        let translationFiles = await getTranlateFiles();
        let selectedFiles = await vscode.window.showQuickPick(translationFiles, {
          placeHolder: `Select a translation/s file`,
          canPickMany: true
        });

        if (selectedFiles) {
          const key = text
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .join('.')
            .toLowerCase();

          const type = config.get<string>('translocoExtract.type');
          const newText = type === 'pipe' ? `{{ '${key}' | transloco }}` : `{{ t('${key}') }}`;
          editor.edit(builder => builder.replace(selection, newText));

          for (const translationFile of selectedFiles) {
            const translation = fs.readFileSync(translationFile, {
              encoding: 'utf-8'
            });
            const toObject = JSON.parse(translation);
            const value = config.get<string>('translocoExtract.defaultValue') || `Missing value for ${key}`;

            const merged = {
              ...toObject,
              [key]: value
            };

            fs.writeFileSync(translationFile, JSON.stringify(merged, null, 2));
            vscode.window.showInformationMessage(`${key} was added`);
          }
        }
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
