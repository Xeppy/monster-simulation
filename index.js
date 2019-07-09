const chalk             = require('chalk');
const clear             = require('clear');
const figlet            = require('figlet');
const inquirer          = require('./lib/inquirer');
const runMonstersGame   = require('./lib/monsters');

clear();
console.log(
  chalk.yellow(
    figlet.textSync('Monsters!!!', { horizontalLayout: 'full' })
  )
);

const run = async () => {
  const arguments = await inquirer.askMonsterNumber();
  runMonstersGame(arguments);
}
run();