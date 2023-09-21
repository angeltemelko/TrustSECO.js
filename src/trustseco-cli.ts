#!/usr/bin/env node
import { Command } from 'commander';
import install from './commands/install';
import scan from './commands/scan';
import { viewTree } from './commands/view-tree';
import { execSync } from 'child_process';
import { info } from './commands/info';
import {
  helpTextInfo,
  helpTextInstall,
  helpTextScan,
  helpTextUninstall,
  helpTextViewTree,
} from './constants/global-constants';

const program = new Command();

program
  .version('0.1.0')
  .description('Intercept npm install to check trust score');

program
  .command('install <library> [version]')
  .description(
    'Intercept npm install to assess the trustworthiness of a package.'
  )
  .addHelpText('after', helpTextInstall)
  .action((library) => {
    const [packageName, version] = library.split('@');
    install(packageName, version);
  });

program
  .command('scan')
  .description('Scan dependencies to get their trust scores.')
  .option('-d, --dependencies', 'Include transitive dependencies in the scan.')
  .option('-r, --report', 'Export the scan results to a CSV report.')
  .addHelpText('after', helpTextScan)
  .action((options) => {
    scan(options);
  });

program
  .command('uninstall <library>')
  .description('Uninstall a specific library using npm.')
  .addHelpText('after', helpTextUninstall)
  .action((library) => {
    execSync(`npm uninstall ${library}`, { stdio: 'inherit' });
  });

program
  .command('info <library>')
  .description('Retrieve information about a specific library.')
  .addHelpText('after', helpTextInfo)
  .action((library) => {
    const [packageName, version] = library.split('@');
    info(packageName, version);
  });

program
  .command('view-tree <library> [version]')
  .description('Visualize a library’s dependencies and their trust scores.')
  .addHelpText('after', helpTextViewTree)
  .action((library) => {
    let packageName, version;

    if (library.startsWith('@')) {
        const parts = library.split('@');
        packageName = `@${parts[1]}`;
        version = parts[2];
    } else {
        const parts = library.split('@');
        packageName = parts[0];
        version = parts[1];
    }

    viewTree(packageName, version);
  });

program.parse(process.argv);
