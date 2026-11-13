import {
  isLiteralElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  MessageFormatElement,
  TYPE,
} from '@formatjs/icu-messageformat-parser';

const MARKER_START = '';
const MARKER_END = '';

export function placeholderMarker(index: number) {
  return `${MARKER_START}${index}${MARKER_END}`;
}

export function placeholderName(index: number | string) {
  return `__transloco_${index}`;
}

export function hasPlaceholderMarker(message: string) {
  return message.includes(MARKER_START);
}

export function resolvePlaceholderMarkers(
  elements: MessageFormatElement[],
): MessageFormatElement[] {
  return elements.flatMap((element): MessageFormatElement[] => {
    if (isLiteralElement(element)) {
      return splitLiteral(element.value);
    }

    if (isSelectElement(element) || isPluralElement(element)) {
      const options = Object.fromEntries(
        Object.entries(element.options).map(([name, option]) => [
          name,
          { ...option, value: resolvePlaceholderMarkers(option.value) },
        ]),
      );

      return [{ ...element, options }];
    }

    if (isTagElement(element)) {
      return [
        { ...element, children: resolvePlaceholderMarkers(element.children) },
      ];
    }

    return [element];
  });
}

function splitLiteral(text: string): MessageFormatElement[] {
  return text
    .split(/(\d+)/)
    .map((part, index): MessageFormatElement => {
      return index % 2
        ? { type: TYPE.argument, value: placeholderName(part) }
        : { type: TYPE.literal, value: part };
    })
    .filter((element) => !isLiteralElement(element) || element.value);
}
