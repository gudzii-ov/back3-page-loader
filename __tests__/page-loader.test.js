import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';

import loadPage from '../src';

const ostmpdir = os.tmpdir();
const fixturesPath = path.join(__dirname, '__fixtures__');

const host = 'http://localhost';
const simplePageUrl = '/simple-page';
const assetsPageUrl = '/assets-page';
const assetsPage2Url = '/assets-page-2';
const wrongAssetsPageUrl = '/wrong-assets-page';
const pageNotFoundUrl = '/page-not-found';
const styleUrl = '/assets/style.css';
const scriptUrl = '/assets/script.js';
const imageUrl = '/assets/image.png';
const wrongImageUrl = '/assets/wrong-image.png';

let nockScope;
let simplePageHtml;
let assetsPageHtml;
let assetsPage2Html;
let wrongAssetsPageHtml;
let assetsPageDownloaded;
let assetsPage2Downloaded;
let styleData;
let scriptData;
let imageData;

beforeAll(async () => {
  axios.defaults.adapter = httpAdapter;

  simplePageHtml = await fs.readFile(path.join(fixturesPath, 'simple-page.html'), 'utf8');
  assetsPageHtml = await fs.readFile(path.join(fixturesPath, 'assets-page.html'), 'utf8');
  assetsPage2Html = await fs.readFile(path.join(fixturesPath, 'assets-page-2.html'), 'utf8');
  wrongAssetsPageHtml = await fs.readFile(path.join(fixturesPath, 'wrong-assets-page.html'), 'utf8');
  assetsPageDownloaded = await fs.readFile(path.join(fixturesPath, 'assets-page-downloaded.html'), 'utf8');
  assetsPage2Downloaded = await fs.readFile(path.join(fixturesPath, 'assets-page-2-downloaded.html'), 'utf8');
  styleData = await fs.readFile(path.join(fixturesPath, styleUrl), 'utf8');
  scriptData = await fs.readFile(path.join(fixturesPath, scriptUrl), 'utf8');
  imageData = await fs.readFile(path.join(fixturesPath, imageUrl));

  nockScope = nock(host)
    .persist()
    .get(simplePageUrl)
    .reply(200, simplePageHtml)
    .get(assetsPageUrl)
    .reply(200, assetsPageHtml)
    .get(wrongAssetsPageUrl)
    .reply(200, wrongAssetsPageHtml)
    .get(pageNotFoundUrl)
    .reply(404, 'page not found')
    .get(assetsPage2Url)
    .reply(200, assetsPage2Html)
    .get(styleUrl)
    .reply(200, styleData)
    .get(scriptUrl)
    .reply(200, scriptData)
    .get(imageUrl)
    .reply(200, imageData)
    .get(wrongImageUrl)
    .reply(404, 'not found');
});

afterAll(() => nockScope.persist(false));

describe('Suit #1: download page without assets', () => {
  test('test #1: download html without assets', async () => {
    const tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    const fileName = 'localhost-simple-page.html';
    const outputFilePath = path.resolve(tmpDir, fileName);

    await loadPage(`${host}${simplePageUrl}`, tmpDir);
    await expect(fs.readFile(outputFilePath, 'utf8')).resolves.toBe(simplePageHtml);
  });
});

describe('Suit #2: download page with assets', () => {
  let tmpDir;
  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    await loadPage(`${host}${assetsPageUrl}`, tmpDir);
  });

  test('test #1: check html', async () => {
    const fileName = 'localhost-assets-page.html';
    const outputFilePath = path.resolve(tmpDir, fileName);
    await expect(fs.readFile(outputFilePath, 'utf8')).resolves.toBe(assetsPageDownloaded);
  });

  test('test #2: check stylesheet', async () => {
    const fileName = 'assets-style.css';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page_files', fileName);
    await expect(fs.readFile(outputFilePath, 'utf8')).resolves.toBe(styleData);
  });

  test('test #3: check javascript', async () => {
    const fileName = 'assets-script.js';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page_files', fileName);
    await expect(fs.readFile(outputFilePath, 'utf8')).resolves.toBe(scriptData);
  });

  test('test #4: check image', async () => {
    const fileName = 'assets-image.png';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page_files', fileName);
    await expect(fs.readFile(outputFilePath)).resolves.toEqual(imageData);
  });
});

describe('Suit #3: download page with assets 2', () => {
  let tmpDir;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    await loadPage(`${host}${assetsPage2Url}`, tmpDir);
  });

  test('test #1: check html', async () => {
    const fileName = 'localhost-assets-page-2.html';
    const outputFilePath = path.resolve(tmpDir, fileName);
    await expect(fs.readFile(outputFilePath, 'utf8')).resolves.toBe(assetsPage2Downloaded);
  });

  test('test #2: check javascript', async () => {
    const fileName = 'assets-script.js';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page-2_files', fileName);
    await expect(fs.readFile(outputFilePath, 'utf8')).resolves.toBe(scriptData);
  });

  test('test #3: check image', async () => {
    const fileName = 'assets-image.png';
    const outputFilePath = path.resolve(tmpDir, 'localhost-assets-page-2_files', fileName);
    await expect(fs.readFile(outputFilePath)).resolves.toEqual(imageData);
  });
});

describe('Suit #4: page not found', () => {
  test('check unavailable page', async () => {
    await expect(loadPage(`${host}${pageNotFoundUrl}`, 'tmpDir')).rejects.toThrow();
  });
});

describe('Suit #5: unavailable asset', () => {
  test('test #1: check error', async () => {
    const tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    await expect(loadPage(`${host}${wrongAssetsPageUrl}`, tmpDir)).rejects.toThrow();
  });
});

describe('Suit #6: file system error - no such directory', () => {
  test('test #1: check error', async () => {
    const tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    await fs.rmdir(tmpDir);
    await expect(loadPage(`${host}${assetsPageUrl}`, tmpDir)).rejects.toThrow();
  });
});

describe('Suit #7: file system error - file exists', () => {
  test('test #1: check error', async () => {
    const tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    await loadPage(`${host}${assetsPageUrl}`, tmpDir);
    await expect(loadPage(`${host}${assetsPageUrl}`, tmpDir)).rejects.toThrow();
  });
});

describe('Suit #8: file system error - file exists (without assets)', () => {
  test('test #1: check error', async () => {
    const tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
    await loadPage(`${host}${simplePageUrl}`, tmpDir);

    await expect(loadPage(`${host}${simplePageUrl}`, tmpDir)).rejects.toThrow();
  });
});
