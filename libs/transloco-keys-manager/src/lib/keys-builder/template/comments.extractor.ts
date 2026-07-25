import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

import { getConfig } from '../../config';
import { TEMPLATE_TYPE } from '../../types';
import { readFile } from '../../utils/file.utils';
import { regexFactoryMap } from '../../utils/regexs.utils';
import { addCommentSectionKeys } from '../add-comment-section-keys';

import { ContainersMetadata, TemplateExtractorConfig } from './types';

/**
 * We can't use AST here since the comments markings support the read property, and the AST extracts them without context
 * */
export function templateCommentsExtractor({
  file,
  scopes,
  defaultValue,
  scopeToKeys,
}: TemplateExtractorConfig) {
  const { hasComments, content } = keepMarkingCommentsOnly(readFile(file));
  if (!hasComments) return scopeToKeys;

  const templateContainers: ContainersMetadata[] = [];
  const baseParams = { defaultValue, scopes, scopeToKeys };

  const { containers, hasStructural } = getNgTemplateContainers(content);
  if (containers.length > 0) {
    const fileTemplate = hasStructural
      ? content.replace(/\*transloco/g, '__transloco')
      : content;
    const $ = loadCheerio(fileTemplate);

    for (const query of containers) {
      $<Element, string>(query).each((_, element) => {
        const containerType = element.attribs.__transloco
          ? TEMPLATE_TYPE.STRUCTURAL
          : TEMPLATE_TYPE.NG_TEMPLATE;
        templateContainers.push({
          containerContent: $(element).html()!,
          read: extractReadValue(element, containerType),
        });
      });
    }
  }

  /** Add the global content to the containers array */
  templateContainers.push({ containerContent: loadCheerio(content).html() });

  templateContainers.forEach(({ containerContent, read }, _, arr) => {
    addCommentSectionKeys({
      read,
      regexFactory: regexFactoryMap.template.comments,
      content: removeInnerContainers(containerContent, arr),
      ...baseParams,
    });
  });

  return scopeToKeys;
}

function getNgTemplateContainers(content: string) {
  const hasNgTemplate = content.match(/<ng-template[^>]*transloco[^>]*>/);
  const hasStructural = content.includes('*transloco');

  const containers: string[] = [];
  if (hasNgTemplate) containers.push('ng-template[transloco]');
  if (hasStructural) containers.push('[__transloco]');

  return {
    containers,
    hasStructural,
  };
}

function keepMarkingCommentsOnly(content: string) {
  const { marker } = getConfig();
  const validMarking = regexFactoryMap.template.validateComment(marker);
  let hasComments = false;

  return {
    /* Search all comments, if they include anything but the markings remove them */
    content: content.replace(regexFactoryMap.template.comments(), (comment) => {
      if (validMarking.test(comment)) {
        hasComments = true;

        return comment;
      }

      return '';
    }),
    hasComments,
  };
}

function removeInnerContainers(
  content: string,
  allContainers: ContainersMetadata[],
): string {
  return allContainers
    .filter(
      ({ containerContent }) =>
        content !== containerContent && content.includes(containerContent),
    )
    .reduce(
      (acc, { containerContent }) => acc.replace(containerContent, ''),
      content,
    );
}

function loadCheerio(content: string) {
  return cheerio.load(content, {
    xml: {
      decodeEntities: false,
    },
  });
}

/** Get the read value from an ngTemplate/ngContainer element */
function extractReadValue(
  element: Element,
  templateType: TEMPLATE_TYPE,
): string | undefined {
  let read: string | undefined;

  if (templateType === TEMPLATE_TYPE.STRUCTURAL) {
    const data = element.attribs.__transloco;
    const readSearch = data.match(/(?:read|prefix):\s*(['"])(?<read>[^"']*)\1/);
    read = readSearch?.groups?.read;
  }

  if (templateType === TEMPLATE_TYPE.NG_TEMPLATE) {
    const attrs = Object.keys(element.attribs);
    const readSearch = attrs.find((attr) =>
      [
        'translocoread',
        '[translocoread]',
        'translocoprefix',
        '[translocoprefix]',
      ].includes(attr),
    );
    read = readSearch && element.attribs[readSearch].replace(/['"]/g, '');
  }

  return read;
}
