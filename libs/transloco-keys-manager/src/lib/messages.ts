export const messages = {
  keepFlat: 'Keep certain keys flat?',
  keysFound: (keysCount: number, filesCount: number) =>
    `${keysCount} keys were found in ${filesCount} ${
      filesCount > 1 ? 'files' : 'file'
    }.`,
  startBuild: (langsCount: number) =>
    `Starting Translation ${langsCount > 1 ? 'Files' : 'File'} Build`,
  startSearch: 'Starting Search For Missing Keys',
  extract: 'Extracting Template and Component Keys',
  creatingFiles: 'Created the following translation files:',
  merged: (len: number) =>
    `Existing translation file${len > 1 ? 's were' : ' was'} found and merged`,
  checkMissing: 'Checking for missing keys',
  pathDoesntExist: `path provided doesn't exist!`,
  pathIsNotDir: `requires a directory.`,
  summary: 'Summary',
  noMissing: 'No missing keys were found',
  defaultValue: 'Enter default key value',
  addMissing: 'Add missing keys automatically?',
  missingValue: 'Missing value for',
  done: 'Done!',
  problematicKeysForUnflat: (keys: string[]) =>
    `The following keys won't be accessible when unflatting the object:\n ${keys
      .map((k) => `"${k}"`)
      .join(', ')}`,
};
