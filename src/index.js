import 'source-map-support/register';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import debug from 'debug';

const log = debug('page-loader');
const name = ('page-loader');

log('running %s', name);

const isLinkLocal = (link) => {
  const { hostname } = url.parse(link);
  return hostname === null;
};

const getFileName = (source) => {
  const { pathname } = url.parse(source);
  const extention = pathname.match(/\.\w+$/) === null ? '' : pathname.match(/\.\w+$/)[0];

  return pathname
    .replace(/^\//, '')
    .replace(extention, '')
    .replace(/[\W_]+/g, '-')
    .concat(extention);
};

const getLocalAssetsList = (html) => {
  log('getting assets list');
  const $ = cheerio.load(html);
  const links = $('link')
    .map((index, element) => $(element).attr('href'))
    .get();
  const scripts = $('script')
    .map((index, element) => $(element).attr('src'))
    .get();
  const images = $('img')
    .map((index, element) => $(element).attr('src'))
    .get();

  return [...links, ...scripts, ...images]
    .filter(item => isLinkLocal(item));
};

const loadAsset = (source, outputFilePath) => {
  log('loading asset %s', source);
  return axios
    .get(source, {
      responseType: 'arraybuffer',
    })
    .then(({ data }) => fs.writeFile(outputFilePath, data));
};

// write source data to file, rewrite file if already exists

const loadPage = (source, outputDirectory) => {
  const { hostname, pathname } = url.parse(source);
  const preName = pathname === '/' ? hostname : `${hostname}-${pathname}`;
  const outputHtmlName = preName
    .replace(/^\//, '')
    .replace(/[\W_]+/g, '-')
    .concat('.html');

  const outputHtmlPath = path.join(outputDirectory, outputHtmlName);

  const assetsDirName = outputHtmlName.replace(/\.html$/, '_files');
  const assetsDirPath = path.join(outputDirectory, assetsDirName);

  let assetsUrls;
  let newHtml;

  // download source page
  log('loading page html');
  return axios.get(source)
    .then(({ data }) => {
      const assetsLinks = getLocalAssetsList(data);

      if (assetsLinks.length !== 0) {
        assetsUrls = assetsLinks
          .map(assetLink => url.resolve(source, assetLink))
          .map((assetUrl) => {
            const outputFileName = getFileName(assetUrl);
            const outputFilePath = path.join(assetsDirPath, outputFileName);

            return {
              assetUrl,
              outputFilePath,
            };
          });

        const newHtmlRegExp = assetsLinks
          .map((oldValue) => {
            const newValue = `${assetsDirName}/${getFileName(oldValue)}`;
            return {
              oldValue,
              newValue,
            };
          });

        newHtml = newHtmlRegExp.reduce((acc, currentValue) => {
          const { oldValue, newValue } = currentValue;
          return acc.replace(oldValue, newValue);
        }, data);
      } else {
        assetsUrls = [];
        newHtml = data;
      }
    })
    .then(() => {
      log('create assets dir');
      return fs.mkdir(assetsDirPath);
    })
    .then(() => {
      log('saving html file');
      return fs.writeFile(outputHtmlPath, newHtml);
    })
    .then(() => {
      const promises = assetsUrls
        .map(({ assetUrl, outputFilePath }) => loadAsset(assetUrl, outputFilePath)
          .then(v => ({ result: 'success', value: v }))
          .catch(e => ({ result: 'error', error: `Download asset error: ${e}` })));
      log('saving assets to disk');
      return Promise.all(promises);
    })
    .then((results) => {
      results.forEach(({ result, error }) => {
        if (result === 'error') {
          throw error;
        }
      });
    });
};

export default loadPage;
