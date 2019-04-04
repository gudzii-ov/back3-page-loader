import 'source-map-support/register';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import debug from 'debug';
import _ from 'lodash/fp';

const log = debug('page-loader');
const logAxios = debug('page-loader: axios');
const logAssets = debug('page-loader: assets');
const logAssetsErrors = debug('page-loader: assets: error');

const assetsAttrs = {
  link: 'href',
  script: 'src',
  img: 'src',
};

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
  logAssets('getting assets list');

  const requiredAssets = ['link', 'script', 'img'];
  const $ = cheerio.load(html);

  const allAssets = _.flatten(requiredAssets.map(asset => $(asset)
    .map((index, element) => $(element).attr(assetsAttrs[asset]))
    .get()));

  logAssets('found assets: %O', allAssets);

  const localAssets = allAssets
    .filter(item => isLinkLocal(item));

  logAssets('local assets: %O', localAssets);

  return localAssets;
};

const loadAsset = (source, outputFilePath) => axios
  .get(source, {
    responseType: 'arraybuffer',
  })
  .then(({ data }) => {
    logAssets('loading asset %s to %s', source, outputFilePath);
    logAxios(data);
    return fs.writeFile(outputFilePath, data);
  });

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
  log('new page loading');
  log('source: %s', source);
  log('html file name: %s', outputHtmlName);

  // download source page
  return axios.get(source)
    .then(({ status, data }) => {
      log('loading page html');
      logAxios('axios response: %s %s', status, data);

      const assetsLinks = getLocalAssetsList(data);

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

      logAssets('assets URLs for downloading: %O', assetsUrls);

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
    })
    .then(() => {
      log('create assets dir: %s', assetsDirPath);
      return fs.mkdir(assetsDirPath);
    })
    .then(() => {
      log('assets dir created successfully');
      log('saving html file to %s', outputHtmlPath);
      return fs.writeFile(outputHtmlPath, newHtml);
    })
    .then(() => {
      log('html saved successfully');
      const promises = assetsUrls
        .map(({ assetUrl, outputFilePath }) => loadAsset(assetUrl, outputFilePath)
          .then(value => ({ result: 'success', value }))
          .catch(e => ({ result: 'error', error: `Download asset error: ${e}` })));
      logAssets('saving assets to disk');
      return Promise.all(promises);
    })
    .then((results) => {
      logAssets('assets loading results: %O', results);
      results.forEach(({ result, error }) => {
        if (result === 'error') {
          logAssetsErrors('unable to download asset');
          throw new Error(error);
        }
      });
    });
};

export default loadPage;
