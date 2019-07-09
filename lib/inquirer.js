const inquirer   = require('inquirer');

module.exports = {

  askMonsterNumber: () => {
    const questions = [
      {
        name: 'file',
        type: 'list',
        message: 'Would you like to unleash your terror on a small or large world?',
        choices: [
          'Small (28 Cities)',
          'Large (6763 Cities)'
        ]
      },
      {
        name: 'monsters',
        type: 'input',
        message: 'Number of monsters you wish to unleash?',
        validate: function( value ) {
          if (parseInt(value) > 1 && parseInt(value) <= 10000 ) {
            return true;
          } else if (parseInt(value) < 2) {
            return `You won't cause much damage with just 1 monster :/ Unleash more than that!`;
          } else if (parseInt(value) > 10000) {
            // Setting an arbitrary limit of 10,000 monsters, can be increased
            return `You don't have that many monsters available! Maybe climb those evil Overlord ranks first ;) Please type a number less than 10,000`;
          } else {
            return 'Please enter a valid number!';
          }
        }
      },
    ];
    return inquirer.prompt(questions);
  },
}