export const enum TranslocoErrorCode {
  NoLoaderProvidedForPath = 1,
  FunctionalTranspilerInvalidSyntax,
  UnableToLoadTranslation,
  NoFallbackLanguageProvided,
}

export function formatTranslocoError(code: TranslocoErrorCode) {
  // Prints a message with an error code to notify the user that something is
  // wrong. This might also be logged in production, but without the full message.
  return `[transloco]:${code}`;
}
