const arg = require('arg');
const readline = require('readline');
const chalk = require('chalk');

let rl;
let commands = [];
let cmdHelpText = '';
let cmdHelp = {};
let aliases = { };

function setCommandLineHelp(k, v) {
  cmdHelp[k] = v;
}

function initCommandLine(cmd0, commandLineArgs) {
  cmdHelpText = `Usage: ${chalk.yellow(cmd0)} [${chalk.green('options')}], where ${chalk.green('options')} can be:\n`;
  for (let k in commandLineArgs) {
    let opt = commandLineArgs[k];
    if (typeof opt === 'string') {
      if (aliases[k] === undefined) aliases[k] = [];  // first one for [k]
      aliases[k].push(opt);
    } else {
      let desc = cmdHelp[k] || '(missing help description)';
      cmdHelpText += `  ${chalk.yellow(k)} (${desc})\n`;
    }
  }
  cmdHelpText += `These options also have these short-form ${chalk.green('aliases')}:\n`;
  for (let a in aliases) {
    cmdHelpText += `  ${chalk.yellow(a)}: ${chalk.green(aliases[a].join(' '))}\n`;
  }
  return arg(commandLineArgs);
}

function onCommandLineHelp() {
  console.log(cmdHelpText);
}

function onHelp() {
  let cmds = [ ];
  for (let cmd in commands) {
    if (commands.hasOwnProperty(cmd)) {
      cmds.push(cmd);
    }
  }
  console.log(`The following commands are available:\n${cmds.join(', ')}`);
}

function onQuit() {
  rl.close();
}

function init(input, output) {
  rl = readline.createInterface({input, output});
  addCommand(onHelp, ['help', '?']);
  addCommand(onQuit, ['quit', 'exit', 'bye']);
}

function addCommand(handler, cmds) {
  if (!(handler && cmds)) return;
  if (!Array.isArray(cmds))
    cmds = [ cmds ];

  for (let cmd of cmds) {
    commands[cmd.toLowerCase()] = handler;
  }
}

async function process(line) {
  let trimmed = line.trim();
  if (!trimmed) return;

  let tokens = trimmed.split(' ');
  let cmd = tokens[0].toLowerCase();
  if (commands.hasOwnProperty(cmd)) {
    let handler = commands[cmd];
    try {
      await handler(tokens, trimmed)
    } catch (err) {
      console.log("Exception start:");
      console.log(err.message);
      console.log("Exception end.");
    }
  } else {
    console.log(`Command '${cmd}' not recognized.`);
  }
}

async function run() {
  rl.prompt();
  rl.on('line', async (line) => {
    await process(line);
    rl.prompt();
  });
}

module.exports = {
  setCommandLineHelp, initCommandLine, onCommandLineHelp,
  init, addCommand, process, run
}
