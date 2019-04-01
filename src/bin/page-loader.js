#!/usr/bin/env node

import program from 'commander';
import pageLoader from '..';
import { version } from '../../package.json';

program
  .version(version)
  .description('Download web page to choosen directory.')
  .option('-o, --output [outputDirectory]', 'Output directory', process.cwd()) // use current directory as default
  .arguments('<source>')
  .action(source => pageLoader(source, program.output)
    .then(() => console.log('download success'))
    .catch(({ response: { status, statusText } }) => console.log(`Error occured: ${status} ${statusText}`)));

program.parse(process.argv);
