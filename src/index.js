import 'source-map-support/register';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import debug from 'debug';
import _ from 'lodash/fp';
import Listr from 'listr';

const log = debug('page-loader');
const logAxios = debug('page-loader: axios');
const logAssets = debug('page-loader: assets');

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

  log('new page loading');
  log('source: %s', source);
  log('html file name: %s', outputHtmlName);

  // download source page
  const loadPageTasks = new Listr([
    {
      title: 'Download source page',
      task: ctx => axios
        .get(source)
        .then(({ status, data }) => {
          log('loading page html');
          logAxios('axios response: %s %s', status, data);
          ctx.data = data;
        }),
    },
    {
      title: 'get assets list',
      task: (ctx) => {
        ctx.assetsLinks = getLocalAssetsList(ctx.data);

        ctx.assetsUrls = ctx.assetsLinks
          .map(assetLink => url.resolve(source, assetLink))
          .map((assetUrl) => {
            const outputFileName = getFileName(assetUrl);
            const outputFilePath = path.join(assetsDirPath, outputFileName);

            return {
              assetUrl,
              outputFilePath,
            };
          });

        logAssets('assets URLs for downloading: %O', ctx.assetsUrls);
      },
    },
    {
      title: 'localize html assets',
      task: (ctx) => {
        const newHtmlRegExp = ctx.assetsLinks
          .map((oldValue) => {
            const newValue = `${assetsDirName}/${getFileName(oldValue)}`;
            return {
              oldValue,
              newValue,
            };
          });

        ctx.newHtml = newHtmlRegExp.reduce((acc, currentValue) => {
          const { oldValue, newValue } = currentValue;
          return acc.replace(oldValue, newValue);
        }, ctx.data);
      },
    },
    {
      title: 'create assets dir',
      task: () => {
        log('create assets dir: %s', assetsDirPath);
        return fs.mkdir(assetsDirPath);
      },
    },
    {
      title: 'save html',
      task: (ctx) => {
        log('assets dir created successfully');
        log('saving html file to %s', outputHtmlPath);
        fs.writeFile(outputHtmlPath, ctx.newHtml);
      },
    },
    {
      title: 'save assets',
      task: (ctx) => {
        log('html saved successfully');
        const assetsTasks = ctx.assetsUrls
          .map(({ assetUrl, outputFilePath }) => ({
            title: `Loading asset from ${assetUrl} to ${outputFilePath}`,
            task: () => loadAsset(assetUrl, outputFilePath),
          }));

        logAssets('saving assets to disk');
        return new Listr(assetsTasks, {
          concurrent: true, exitOnError: false,
        });
      },
    },
  ]);
  return loadPageTasks.run();
};

export default loadPage;
