import 'source-map-support/register';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import url from 'url';

// write source data to file, rewrite file if already exists

const loadPage = (source, outputDirectory) => {
  const { hostname, pathname } = url.parse(source);
  const outputHtmlName = `${hostname}-${pathname}`.replace(/[\W_]+/g, '-').concat('.html');
  const outputHtmlPath = path.join(outputDirectory, outputHtmlName);

  // download source page
  return axios.get(source)
    .then(({ data }) => fs.writeFile(outputHtmlPath, data));
};

export default loadPage;
