import { Target } from '@angular-devkit/architect';
import * as cheerio from 'cheerio';

export default (_: Target, indexHtml: string) => {
  if (!process.env.ORIGIN) {
    return indexHtml;
  }

  const $ = cheerio.load(indexHtml);
  $('base').attr('href', process.env.ORIGIN);

  return $.html();
};
