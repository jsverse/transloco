import * as cheerio from 'cheerio';

export default async (indexHtml: string) => {
  if (!process.env.ORIGIN) {
    return indexHtml;
  }

  const $ = cheerio.load(indexHtml);
  $('base').attr('href', process.env.ORIGIN);

  return $.html();
};
