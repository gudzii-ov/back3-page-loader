import 'source-map-support/register';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';

// write source data to file, rewrite file if already exists

const pageLoader = (source, outputDirectory) => {
  const outputFileName = source.replace(/https?:\/\//, '').replace(/[\W_]+/g, '-').concat('.html');
  const outputFilePath = path.join(outputDirectory, outputFileName);

  // download source page
  return axios.get(source)
    .then(({ data }) => fs.writeFile(outputFilePath, data));
};

export default pageLoader;
