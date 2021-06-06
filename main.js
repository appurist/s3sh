#!/usr/bin/env node
const chalk = require('chalk');

const cli = require('./cli')
const s3api = require('./s3api');

const VERSION = '1.0.10125';

// read .env and .env.defaults
require('dotenv-defaults/config');

const logger = console; // for now
let args;
let accessKey, secretKey, bucket;

let cmd0 = 's3sh';      // the name of this command
let commandLineOptions = {
  // Types
  '--access': String,   // --access  <string> or --access=<string>
  '--secret': String,   // --access  <string> or --access=<string>
  '--profile': String,  // --profile <string> or --profile=<string>
  '--bucket': String,   // --bucket  <string> or --bucket=<string>

  '--quiet': Boolean,
  '--verbose': Boolean,
  '--version': Boolean,
  '--help': Boolean,

  // Aliases
  '-a': '--access',
  '-s': '--secret',
  '-b': '--bucket',
  '-p': '--profile',

  '-q': '--quiet',
  '-V': '--verbose',
  '-v': '--version',
  '-h': '--help',
  '-?': '--help'
};

cli.setCommandLineHelp('--access',  'specifies AWS IAM access key, e.g. AKIAIOSFODNN7EXAMPLE');
cli.setCommandLineHelp('--secret',  'specifies AWS IAM secret key, e.g. wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
cli.setCommandLineHelp('--profile', 'specifies AWS user credentials profile to use (from the ~/.aws folder)');
cli.setCommandLineHelp('--bucket',  'specifies AWS S3 bucket to use');
cli.setCommandLineHelp('--verbose', 'enables verbose mode, showing more output');
cli.setCommandLineHelp('--version', 'displays the version number of this utility');
cli.setCommandLineHelp('--help',    'shows this command-line syntax help');

function handleShutdown(rc) {
  process.exit(rc);
}

process.on('SIGTERM', () => {
  logger.info('Terminate (SIGTERM) signal received.');
  handleShutdown(0);
});
process.on('SIGINT', () => {
  logger.info('Interrupt (SIGINT) signal received.');
  handleShutdown(0);
});

function onError(err) {
  logger.error("Server error:", err.message);
  handleShutdown(1);  //mandatory return code (as per the Node.js docs)
}
process.on('uncaughtException', onError);

function onAccessKey(tokens) {
  if ((tokens.length !== 2) || (tokens[1]==='?') || (tokens[1]==='help')) {
    console.log('Syntax: access <access-key>');
    return;
  }
  accessKey = tokens[1];
  // s3api.setAccessKey(accessKey);
  console.log("Access key set to:", accessKey);
}

function onSecretKey(tokens) {
  if ((tokens.length !== 2) || (tokens[1]==='?') || (tokens[1]==='help')) {
    console.log('Syntax: secret <secret-key>');
    return;
  }
  secretKey = tokens[1];
  // s3api.setAccessKey(secretKey);
  console.log("Secret key set to:", secretKey);
}

function onBucket(tokens) {
  if ((tokens.length !== 2) || (tokens[1]==='?') || (tokens[1]==='help')) {
    console.log('Syntax: bucket <name>');
    return;
  }
  bucket = tokens[1];
  // s3api.setProjectId(projectId);
  console.log("Bucket ID set to:", bucket);
}

async function onList(tokens) {
  if ((tokens.length !== 2) || (tokens[1]==='?') || (tokens[1]==='help')) {
    console.log('Syntax: list <what>');
    return;
  }
  let results = await s3api.docList(tokens[1]);
  // console.log("list:", results);
  for (let item of results) {
    if (item.type === 'folder') {
      console.log(`  ${chalk.yellow(item.name)} [${chalk.magenta(item.type)}]`);
    } else {
      console.log(`  ${chalk.green(item.name)} ${chalk.magenta(item.size)} bytes [${chalk.grey(item.modified)}]`);
    }
  }
}

async function onGet(tokens) {
  if ((tokens.length !== 2) || (tokens[1]==='?') || (tokens[1]==='help')) {
    console.log('Syntax: read <what>');
    return;
  }
  let what = tokens[1];
  let doc = await s3api.docGet(what);
  // console.log(`${doc.path}:\n`+JSON.stringify(doc.data, null, 2));
  console.log(what+":\n"+JSON.stringify(doc, null, 2));
}

async function onShow(tokens) {
  if ((tokens.length !== 2) || (tokens[1]==='?') || (tokens[1]==='help')) {
    console.log('Syntax: read <what>');
    return;
  }
  let what = tokens[1];
  let doc = await s3api.docGet(what);
  // console.log(`${doc.path}:\n`+JSON.stringify(doc.data, null, 2));
  console.log(what+":\n"+doc);
}

async function onInit(tokens) {
  await s3api.init();
}

try {
  args = cli.initCommandLine(cmd0, commandLineOptions);
} catch (err) {
  console.error(err.message);
  handleShutdown(1);
}

// Mainline / top-level async function invocation.
(async () => {
  try {
    if (!args['--quiet']) {
      console.log(chalk.yellow("s3sh - S3 Shell ")+chalk.magenta(VERSION))
    }
    if (args['--help']) {
      cli.onCommandLineHelp();
      handleShutdown(0);
    }
    
    await s3api.init();
    cli.init(process.stdin, process.stdout);
    cli.addCommand(onAccessKey, ['access']);
    cli.addCommand(onSecretKey, ['secret']);
    cli.addCommand(onBucket,    ['bucket', 'proj', 'projectid', 'project', 'id']);
    cli.addCommand(onList,      ['list', 'ls', 'dir']);
    cli.addCommand(onGet,       ['get', 'dump']);
    cli.addCommand(onShow,      ['read', 'type', 'cat']);
    await cli.run();
  } catch (e) {
    logger.error(e);
  }
})();