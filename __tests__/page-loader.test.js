import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';

import app from '../src';

const data = {};

beforeAll(async () => {
  axios.defaults.adapter = httpAdapter;

  data.ostmpdir = os.tmpdir();
  data.host = 'http://localhost';
  data.simplePageUrl = '/simple-page';
  data.simplePageHtml = await fs.readFile(path.join(__dirname, '__fixtures__/simple-page.html'), 'utf8');

  nock(data.host)
    .log(console.log)
    .get(data.simplePageUrl)
    .reply(200, data.simplePageHtml);
});

test('test#1: download html without assets', async () => {
  const {
    ostmpdir, host, simplePageUrl, simplePageHtml,
  } = data;

  const tmpDir = await fs.mkdtemp(path.join(ostmpdir, 'page-loader-'));
  const fileName = 'localhost-simple-page.html';
  const filePath = path.resolve(tmpDir, fileName);

  await app(`${host}${simplePageUrl}`, tmpDir);
  const result = fs.readFile(filePath, 'utf8');
  return expect(result).resolves.toBe(simplePageHtml);
});
