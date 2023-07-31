import { Target } from '@angular-devkit/architect';
import * as cheerio from 'cheerio';

export default (targetOptions: Target, indexHtml: string) => {
  const $ = cheerio.load(indexHtml);
  $('base').attr(
    'href',
    process.env.ORIGIN + '/transloco/transloco-playground/'
  );

  return $.html();
};
