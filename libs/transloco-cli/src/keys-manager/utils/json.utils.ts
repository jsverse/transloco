import { ParseError, parse, printParseErrorCode } from 'jsonc-parser';

export function jsoncParser(filepath: string, content: string) {
  const errors: ParseError[] = [];
  const result = parse(content, errors, {
    allowTrailingComma: true,
  });
  if (errors.length > 0) {
    const { error, offset } = errors[0];
    throw new Error(
      `Failed to parse "${filepath}" as JSON AST Object. ${printParseErrorCode(
        error,
      )} at location: ${offset}.`,
    );
  }
  return result;
}
