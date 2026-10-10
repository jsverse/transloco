/** A member of a JSON object, and where it stands in the text. */
interface Member {
  key: string;
  keyStart: number;
  valueStart: number;
  valueEnd: number;
  /** The blanks between the `{` or the `,` before the member and its key. */
  before: string;
  /** What stands between the key and the value, the colon and the blanks around it. */
  colon: string;
}

const skipBlanks = (source: string, index: number) => {
  while (index < source.length && /\s/.test(source[index])) index++;

  return index;
};

/** The index after the string that starts at `index`. */
const skipString = (source: string, index: number) => {
  for (index++; source[index] !== '"'; index++) {
    if (index >= source.length) throw new Error('Unterminated string');
    if (source[index] === '\\') index++;
  }

  return index + 1;
};

/** The index after the value that starts at `index`. */
function skipValue(source: string, index: number): number {
  if (source[index] === '"') return skipString(source, index);

  if (source[index] === '{' || source[index] === '[') {
    let depth = 0;

    for (; index < source.length; index++) {
      const char = source[index];

      if (char === '"') index = skipString(source, index) - 1;
      else if (char === '{' || char === '[') depth++;
      else if ((char === '}' || char === ']') && --depth === 0)
        return index + 1;
    }
  }

  while (index < source.length && !/[\s,\]}]/.test(source[index])) index++;

  return index;
}

/** The members of the object that opens at `open`, and the index of its `}`. */
function readMembers(source: string, open: number) {
  const members: Member[] = [];
  let index = open + 1;

  while (index < source.length) {
    const blanksStart = index;

    index = skipBlanks(source, index);

    if (source[index] === '}') return { members, close: index };

    const keyEnd = skipString(source, index);
    const valueStart = skipBlanks(source, skipBlanks(source, keyEnd) + 1);
    const valueEnd = skipValue(source, valueStart);

    members.push({
      key: JSON.parse(source.slice(index, keyEnd)) as string,
      keyStart: index,
      valueStart,
      valueEnd,
      before: source.slice(blanksStart, index),
      colon: source.slice(keyEnd, valueStart),
    });
    index = skipBlanks(source, valueEnd);

    if (source[index] === ',') index++;
  }

  throw new Error('Unterminated object');
}

/** The blanks that open the line of a member, which are the indent of the file. */
const indentOf = (before: string) => before.slice(before.lastIndexOf('\n') + 1);

/**
 * Adds `name` to the `devDependencies` of the text of a `package.json`, and
 * changes nothing else: the indentation, the line endings, a byte order mark,
 * the order of the keys and whether the file ends with a line break all stay.
 *
 * The entry goes in alphabetical order. A `devDependencies` that isn't there
 * is created after `dependencies`, or at the end of the file.
 *
 * @returns the new text, or `null` when the file isn't what this knows to edit
 */
export function addDevDependency(
  source: string,
  name: string,
  range: string,
): string | null {
  try {
    const open = skipBlanks(source, 0);

    if (source[open] !== '{') return null;

    const root = readMembers(source, open);
    const newline = source.includes('\r\n') ? '\r\n' : '\n';
    const rootColon = root.members[0]?.colon ?? ': ';
    const multiline = root.members.length
      ? root.members[0].before.includes('\n')
      : source.slice(open, root.close).includes('\n');
    const entry = (colon: string) =>
      `${JSON.stringify(name)}${colon}${JSON.stringify(range)}`;
    const insert = (at: number, text: string) =>
      source.slice(0, at) + text + source.slice(at);
    // The last of two members with a key is the one a JSON parser keeps
    const lastNamed = (key: string) =>
      root.members.filter((member) => member.key === key).pop();
    const section = lastNamed('devDependencies');

    if (section) {
      if (source[section.valueStart] !== '{') return null;

      const { members, close } = readMembers(source, section.valueStart);

      if (members.length) {
        const next = members.find(
          (member) => member.key.localeCompare(name, 'en') > 0,
        );
        const text = entry(members[0].colon);

        if (next) return insert(next.keyStart, `${text},${next.before}`);

        const last = members[members.length - 1];

        return insert(last.valueEnd, `,${last.before}${text}`);
      }

      const text = entry(rootColon);
      const indent = indentOf(section.before);

      if (source.slice(section.valueStart, close).includes('\n')) {
        return insert(
          section.valueStart + 1,
          `${newline}${indent}${indent}${text}`,
        );
      }

      return insert(
        section.valueStart + 1,
        multiline
          ? `${newline}${indent}${indent}${text}${newline}${indent}`
          : text,
      );
    }

    const anchor =
      lastNamed('dependencies') ?? root.members[root.members.length - 1];
    const key = `"devDependencies"${rootColon}`;

    if (!anchor) {
      return insert(
        open + 1,
        multiline
          ? `${newline}  ${key}{${newline}    ${entry(rootColon)}${newline}  }`
          : `${key}{${entry(rootColon)}}`,
      );
    }

    const indent = indentOf(anchor.before);
    const created = anchor.before.includes('\n')
      ? `{${newline}${indent}${indent}${entry(rootColon)}${newline}${indent}}`
      : `{${entry(rootColon)}}`;

    return insert(anchor.valueEnd, `,${anchor.before}${key}${created}`);
  } catch {
    return null;
  }
}
