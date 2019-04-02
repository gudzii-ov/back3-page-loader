import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';

import loadPage from '../src';

beforeAll(async () => {
  axios.defaults.adapter = httpAdapter;
});

describe('Suit #1: download page without assets', () => {
  const ostmpdir = os.tmpdir();
  const host = 'http://localhost';

  test('test #1: download html without assets', async () => {
    const simplePageUrl = '/simple-page';
    const simplePageFixturePath = path.join(__dirname, '__fixtures__/simple-page.html');

    const tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));

    const fileName = 'localhost-simple-page.html';
    const outputFilePath = path.resolve(tmpDir, fileName);
    const simplePageHtml = await fs.readFile(simplePageFixturePath, 'utf8');

    nock(host)
      .get(simplePageUrl)
      .reply(200, simplePageHtml);

    await loadPage(`${host}${simplePageUrl}`, tmpDir);
    const result = await fs.readFile(outputFilePath, 'utf8');
    return expect(result).toBe(simplePageHtml);
  });
});

describe('Suit #2: download page with assets', () => {
  const ostmpdir = os.tmpdir();
  const fixturesPath = path.join(__dirname, '__fixtures__');
  const assetsPagePath = path.join(fixturesPath, 'assets-page.html');
  const downloadedPagePath = path.join(fixturesPath, 'assets-page-downloaded.html');

  const assetsPageUrl = '/assets-page';
  const styleUrl = '/assets/style.css';
  const scriptUrl = '/assets/script.js';
  const imageUrl = '/assets/image.png';

  let tmpDir;
  let assetsPageHtml;
  let downloadedPageHtml;
  let styleData;
  let scriptData;
  let imageData;

  beforeAll(async () => {
    const host = 'http://localhost';

    tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    assetsPageHtml = await fs.readFile(assetsPagePath, 'utf8');
    downloadedPageHtml = await fs.readFile(downloadedPagePath, 'utf8');
    styleData = await fs.readFile(path.join(fixturesPath, styleUrl), 'utf8');
    scriptData = await fs.readFile(path.join(fixturesPath, scriptUrl), 'utf8');
    imageData = await fs.readFile(path.join(fixturesPath, imageUrl));

    const nockScope = nock(host)
      .persist()
      .get(assetsPageUrl)
      .reply(200, assetsPageHtml)
      .get(styleUrl)
      .reply(200, styleData)
      .get(scriptUrl)
      .reply(200, scriptData)
      .get(imageUrl)
      .reply(200, imageData);

    await loadPage(`${host}${assetsPageUrl}`, tmpDir);

    nockScope.persist(false);
  });

  test('test #1: check html', async () => {
    const fileName = 'localhost-assets-page.html';
    const outputFilePath = path.resolve(tmpDir, fileName);

    const result = await fs.readFile(outputFilePath, 'utf8');
    return expect(result).toBe(downloadedPageHtml);
  });

  test('test #2: check stylesheet', async () => {
    const fileName = 'assets-style.css';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page_files', fileName);

    const result = await fs.readFile(outputFilePath, 'utf8');
    return expect(result).toBe(styleData);
  });

  test('test #3: check javascript', async () => {
    const fileName = 'assets-script.js';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page_files', fileName);

    const result = await fs.readFile(outputFilePath, 'utf8');
    return expect(result).toBe(scriptData);
  });

  test('test #4: check image', async () => {
    const fileName = 'assets-image.png';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page_files', fileName);

    const result = await fs.readFile(outputFilePath);
    return expect(result).toEqual(imageData);
  });
});

describe('Suit #3: download page with assets 2', () => {
  const ostmpdir = os.tmpdir();
  const fixturesPath = path.join(__dirname, '__fixtures__');
  const assetsPagePath = path.join(fixturesPath, 'assets-page-without-one.html');
  const downloadedPagePath = path.join(fixturesPath, 'assets-page-without-one-downloaded.html');

  const assetsPageUrl = '/assets-page-without-one';
  const styleUrl = '/assets/style.css';
  const scriptUrl = '/assets/script.js';
  const imageUrl = '/assets/image.png';

  let tmpDir;
  let assetsPageHtml;
  let downloadedPageHtml;
  let styleData;
  let scriptData;
  let imageData;

  beforeAll(async () => {
    const host = 'http://localhost';

    tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    assetsPageHtml = await fs.readFile(assetsPagePath, 'utf8');
    downloadedPageHtml = await fs.readFile(downloadedPagePath, 'utf8');
    styleData = await fs.readFile(path.join(fixturesPath, styleUrl), 'utf8');
    scriptData = await fs.readFile(path.join(fixturesPath, scriptUrl), 'utf8');
    imageData = await fs.readFile(path.join(fixturesPath, imageUrl));

    const nockScope = nock(host)
      .persist()
      .get(assetsPageUrl)
      .reply(200, assetsPageHtml)
      .get(styleUrl)
      .reply(200, styleData)
      .get(scriptUrl)
      .reply(200, scriptData)
      .get(imageUrl)
      .reply(200, imageData);

    await loadPage(`${host}${assetsPageUrl}`, tmpDir);

    nockScope.persist(false);
  });

  test('test #1: check html', async () => {
    const fileName = 'localhost-assets-page-without-one.html';
    const outputFilePath = path.resolve(tmpDir, fileName);

    const result = await fs.readFile(outputFilePath, 'utf8');
    return expect(result).toBe(downloadedPageHtml);
  });

  test('test #2: check javascript', async () => {
    const fileName = 'assets-script.js';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page-without-one_files', fileName);

    const result = await fs.readFile(outputFilePath, 'utf8');
    return expect(result).toBe(scriptData);
  });

  test('test #3: check image', async () => {
    const fileName = 'assets-image.png';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page-without-one_files', fileName);

    const result = await fs.readFile(outputFilePath);
    return expect(result).toEqual(imageData);
  });
});
