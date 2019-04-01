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

describe('Test downloading example pages', () => {
  const ostmpdir = os.tmpdir();
  const host = 'http://localhost';

  test('test #1: download html without assets to custom directory', async () => {
    const simplePageUrl = '/simple-page';
    const simplePageFixturePath = path.join(__dirname, '__fixtures__/simple-page.html');

    const tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));

    const fileName = 'localhost-simple-page.html';
    const outputFilePath = path.resolve(tmpDir, fileName);
    const simplePageHtml = await fs.readFile(simplePageFixturePath, 'utf8');

    nock(host)
      .log(console.log)
      .get(simplePageUrl)
      .reply(200, simplePageHtml);

    await loadPage(`${host}${simplePageUrl}`, tmpDir);
    const result = await fs.readFile(outputFilePath, 'utf8');
    return expect(result).toBe(simplePageHtml);
  });
});
