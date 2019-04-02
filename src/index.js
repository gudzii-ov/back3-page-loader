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

const getFileName = (source) => {
  const { pathname } = url.parse(source);
  const extention = pathname.match(/\.\w+$/)[0];

  return pathname
    .replace(/^\//, '')
    .replace(extention, '')
    .replace(/[\W_]+/g, '-')
    .concat(extention);
};

const loadAsset = (source, outputFilePath, responseType) => axios
  .get(source, {
    responseType,
  })
  .then(({ data }) => fs.writeFile(outputFilePath, data));

// write source data to file, rewrite file if already exists

const loadPage = (source, outputDirectory) => {
  const { hostname, pathname } = url.parse(source);
  const outputHtmlName = `${hostname}-${pathname}`.replace(/[\W_]+/g, '-').concat('.html');
  const outputHtmlPath = path.join(outputDirectory, outputHtmlName);

  const assetsDirName = outputHtmlName.replace(/\.html$/, '_files');
  const assetsDirPath = path.join(outputDirectory, assetsDirName);

  let assetsUrls;

  // download source page
  return axios.get(source)
    .then(({ data }) => {
      const $ = cheerio.load(data);
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
        .map((assetUrl) => {
          const outputFileName = getFileName(assetUrl);
          const outputFilePath = path.join(assetsDirPath, outputFileName);

          return {
            assetUrl,
            outputFilePath,
            responseType: 'text',
          };
        });

      const mediaAssetsUrls = images
        .map(assetLink => url.resolve(source, assetLink))
        .map((assetUrl) => {
          const outputFileName = getFileName(assetUrl);
          const outputFilePath = path.join(assetsDirPath, outputFileName);

          return {
            assetUrl,
            outputFilePath,
            responseType: 'arraybuffer',
          };
        });

      assetsUrls = [...textAssetsUrls, ...mediaAssetsUrls];

      const regExp = [...links, ...scripts, ...images]
        .map((oldValue) => {
          const newValue = `${assetsDirName}/${getFileName(oldValue)}`;
          return {
            oldValue,
            newValue,
          };
        });

      const newHtml = regExp.reduce((acc, currentValue) => {
        const { oldValue, newValue } = currentValue;
        return acc.replace(oldValue, newValue);
      }, data);

      return fs.writeFile(outputHtmlPath, newHtml);
    })
    .then(() => fs.mkdir(assetsDirPath))
    .then(() => {
      const promises = assetsUrls
        .map((currentUrl) => {
          const { assetUrl, responseType, outputFilePath } = currentUrl;
          return loadAsset(assetUrl, outputFilePath, responseType);
        });
      return promises;
    })
    .then(promises => Promise.all(promises));
};

export default loadPage;
