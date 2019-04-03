#!/usr/bin/env node

import program from 'commander';
import loadPage from '..';
import { version } from '../../package.json';

program
  .version(version)
  .description('Download web page to choosen directory.')
  .option('-o, --output [outputDirectory]', 'Output directory', process.cwd()) // use current directory as default
  .arguments('<source>')
  .action(source => loadPage(source, program.output)
    .then(() => console.log('Download successfull'))
    .catch((error) => {
      console.error(`Error occured: ${error}`);
      process.exit(1);
    }));

program.parse(process.argv);
