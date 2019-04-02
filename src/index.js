import 'source-map-support/register';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import url from 'url';
import cheerio from 'cheerio';

const isLinkLocal = (link) => {
  const { hostname } = url.parse(link);
  return hostname === null;
};

const loadAsset = (source, outputDirectory, responseType) => {
  const { pathname } = url.parse(source);
  const extention = pathname.match(/\.\w+$/)[0];
  const extRegExp = new RegExp(extention);
  const outputFileName = pathname
    .replace(/^\//, '')
    .replace(extRegExp, '')
    .replace(/[\W_]+/g, '-')
    .concat(extention);
  const outputFilePath = path.join(outputDirectory, outputFileName);

  return axios
    .get(source, {
      responseType,
    })
    .then(({ data }) => fs.writeFile(outputFilePath, data));
};

// write source data to file, rewrite file if already exists

const loadPage = (source, outputDirectory) => {
  const { hostname, pathname } = url.parse(source);
  const outputHtmlName = `${hostname}-${pathname}`.replace(/[\W_]+/g, '-').concat('.html');
  const outputHtmlPath = path.join(outputDirectory, outputHtmlName);

  const assetsDirName = outputHtmlName.replace(/\.html$/, '_files');
  const assetsDirPath = path.join(outputDirectory, assetsDirName);

  let $;
  let assetsUrls;

  // download source page
  return axios.get(source)
    .then(({ data }) => {
      $ = cheerio.load(data);
      return fs.writeFile(outputHtmlPath, data);
    })
    .then(() => {
      const links = $('link')
        .map((index, element) => $(element).attr('href'))
        .get()
        .filter(assetLink => isLinkLocal(assetLink));
      const scripts = $('script')
        .map((index, element) => $(element).attr('src'))
        .get()
        .filter(assetLink => isLinkLocal(assetLink));
      const images = $('img')
        .map((index, element) => $(element).attr('src'))
        .get()
        .filter(assetLink => isLinkLocal(assetLink));

      const textAssetsUrls = [...links, ...scripts]
        .map(assetLink => url.resolve(source, assetLink))
        .map(assetUrl => ({
          assetUrl,
          responseType: 'text',
        }));

      const mediaAssetsUrls = images
        .map(assetLink => url.resolve(source, assetLink))
        .map(assetUrl => ({
          assetUrl,
          responseType: 'arraybuffer',
        }));

      assetsUrls = [...textAssetsUrls, ...mediaAssetsUrls];
    })
    .then(() => fs.mkdir(assetsDirPath))
    .then(() => {
      const promises = assetsUrls
        .map(({ assetUrl, responseType }) => loadAsset(assetUrl, assetsDirPath, responseType));
      return promises;
    })
    .then(promises => Promise.all(promises));
};

export default loadPage;
