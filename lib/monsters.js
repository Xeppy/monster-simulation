const fs      = require('fs');
const chalk   = require('chalk');
const figlet  = require('figlet');

// THE MAIN GAME
module.exports = function runMonsterGame(arguments) {
  // Retrieve cli Arguments
  const originalAmountOfMons = parseInt(arguments.monsters);
  const mapSize = arguments.file.toString();
  let cityList;
  // Check which mapSize user selected
  if (mapSize === 'Small (28 Cities)') {
    cityList = fs.readFileSync(__dirname + '/world_map_small.txt').toString().split("\n");
  } else if (mapSize === 'Large (6763 Cities)') {
    cityList = fs.readFileSync(__dirname + '/world_map_medium.txt').toString().split("\n");
  } else {
    // By default use medium map
    cityList = fs.readFileSync(__dirname + '/world_map_medium.txt').toString().split("\n");
  }
  // Cities will be the array that holds all the cities as objects, an a list of the monsters occupying them
  let cities = [];
  // The Monsters we'll be sending to fight
  let mons = [];
  // A counter to keep track of how many monsters are left
  let nrOfMons = originalAmountOfMons;
  let nrOfMoves = 0;

  // Filling our cities array with city objects
  cityList.forEach(element => {
    let cityString = element.split(" ");
    if (cityString.length > 0 && cityString[0].length > 0) {
      /*
      Current city object structure e.g: {
        name: 'Anu',
        mons: [ 'Monster 1', 'Monster 4'],
        links: {
          north: '',
          east: '',
          south: '',
          west: '',
        }
      }
      */
      let city = cityString.shift()
      let links = {};

      for (const el of cityString) {
          const link = el.split('=');
          links[link[0]] = link[1];
      }

      cities.push({
        name: city,
        mons: [],
        links,
      });
    }
  });

  for (let i = 1; i <= nrOfMons; i++) {
    mons.push('Monster ' + i);
  }

  // Initially assigining Monsters to random Cities, there is an assumption made that multiple monsters can start in the same city
  function distributeMons() {
    // Looping through the Monsters available to us
    while (mons.length > 0) {
      let randomMon = mons[pickRandomIndex(mons)];
      let randomCity = cities[pickRandomIndex(cities)];
      mons = mons.filter( el => {
        return el != randomMon;
      });

      //
      cities.find((city, i) => {
        if (city.name === randomCity.name) {
          cities[i].mons.push(randomMon);
        }
      });
    }
  }

  function resolveBattle() {
    cities.forEach(city=> {
      // If there is more than one monster inside a city...
      if (city.mons.length  > 1) {
        // Print out a message of which fight occured, in which city and between which mons
        console.log(chalk.bgRed(city.mons[0] + ' and ' + city.mons[1] + ' fought until ' + city.name + ' was destroyed in their wake'));
        // 2 monsters will have died
        nrOfMons = nrOfMons - 2;
        // A conditional to catch any extra monsters that were in the same city
        if (city.mons.length > 2) {
          for (let i = 2; i < city.mons.length; i++) {
            console.log(chalk.red(city.mons[i] + ' was caught in the crossfire!'));
            nrOfMons = nrOfMons - 1;
          }
        }
        // We filter out the destroyed city from existence, bye bye...
        cities = cities.filter(el => el.name !== city.name);

        // Now we loop through the links that the destoryed city had
        Object.keys(city.links).forEach(key => {
          // Affected Link will be the city name
          let affectedLink = city.links[key];
          // We bring up the city object of that affected linked city
          let linkedCity = cities.find(el => el.name === affectedLink);
          // We determine the direction that the affected city will lose
          if (linkedCity) {
            let affectedDirection = Object.keys(linkedCity.links).find(key => linkedCity.links[key] === city.name);
            // We mutate the original array of cities and set that direction to null
            cities.find(el => el.name === affectedLink).links[affectedDirection] = null;
          }
        });
      }
    });
    console.log(chalk.yellow('There are ' + cities.length + ' cities and ' + nrOfMons + ' monsters left'));
  }

  function travelToCities() {
    // List of travelled keeps track of any monsters that have already moved in a single round
    // So as to avoid moving those monsters and then getting to the city they've moved to 
    // And then moving them again
    // It is not detrimental to the simulation but this makes for a smoother and more expected experience
    let listOfTravelled = [];

    cities.forEach(city => {
      if (city.mons.length > 0) {
        // Our monster we're going to make travel
        // NOTE: There should never be more than 1 monster in a city when this function is called
        let mon = city.mons[0];
        // Check if Monster has already travelled this round
        if (!(listOfTravelled.includes(mon))) {
          // List all the links that weren't destroyed (i.e. not null)
          let cityLinks = Object.values(city.links).filter(el => el !== null);
          // If we have somewhere we can travel to
          if (cityLinks.length > 0) {
            let randomCity = cityLinks[pickRandomIndex(cityLinks)];
            cities.find(el => el.name === city.name).mons.pop();
            //We copy the array of monsters present on that city
            let listOfOccupyingMons = cities.find(el => el.name === randomCity).mons;
            if (!listOfOccupyingMons.includes(mon)) {
              // We add our new monster onto the list of monsters
              listOfOccupyingMons.push(mon);
            }
            // We set the new list of monsters occupying our city
            cities.find(el => el.name === randomCity).mons = listOfOccupyingMons;
            //This monster has now moved and so we push it to our list of Travellers
            listOfTravelled.push(mon);
            // Increment the number of moves that have been made
            nrOfMoves+= 1;
          } else {
            // The City is lost and gets destroyed as well as the inhabiting monster,
            // There is an assumption that there can never be more than one monster in a trapped city
            // because they would have fought in the resolveBattle() had they both been present there
            // and furthermore, no new monsters could have travelled there due to missing links
            console.log(chalk.red(city.name + ' was cut off from the rest of the world!'));
            console.log(chalk.bgRed(mon + ' killed itself out of boredom'));
            cities = cities.filter(el => el.name !== city.name);
            nrOfMons = nrOfMons - 1;
          }
        } else {
          // Could potentially get stuck in an infinite loop if no units move so we advance nrOfMoves
          // By the amount of monsters there
          nrOfMoves+= nrOfMons;
        }
      }
    });
  }

  function createFinalListOfCities() {
    let finalCityArray = [];
    cities.forEach(city => {
      // Set all the directions empty on each loop
      let north   = '';
      let south   = '';
      let east    = '';
      let west    = '';
      // Check which directions are present and set the city if they are
      if (city.links.north && city.links.north !== null) {
        north = city.links.north;
      }
      if (city.links.south && city.links.south !== null) {
        south = city.links.south;
      }
      if (city.links.east && city.links.east !== null) {
        east = city.links.east;
      }
      if (city.links.west && city.links.west !== null) {
        west = city.links.west;
      }
      // I don't like how i'm doing the formatting here, it feels a little messy, would potentially
      // refactor this to maybe use some sort of loop
      let string = `${city.name} ${north.length > 0 ? `north=${north} ` : ''}${south.length > 0 ? `south=${south} ` : ''}${east.length > 0 ? `east=${east} ` : ''}${west.length > 0 ? 'west=' + west : ''}`;
      finalCityArray.push(string);
    });
    return finalCityArray;
  }

  // This initiates the game and calls the functions in coherent order for easier readability
  function initiateWorld() {
    console.log(chalk.cyan('Welcome to an epic battle!'));
  // Monster distribution
    console.log(chalk.green(nrOfMons + ' Monsters are being randomly distributed...'));
    distributeMons();
  // If we have more than 1 monster left or haven't reached the maximum nr of Moves, we fight
  // And then move the monsters
    while (nrOfMons > 1 && nrOfMoves <= 10000) {
      resolveBattle();
      travelToCities();
    }

  // Once the simulation is over and everything has been resolved
  // Log the results and put togerther the final City Array
    console.log(
      chalk.green(
        figlet.textSync('FINAL RESULT', { horizontalLayout: 'full'})
      )
    );
    console.log(chalk.green(nrOfMons + ' Monsters left out of your initial ' + originalAmountOfMons));
    console.log(chalk.red(cityList.length - cities.length + ' Cities Destroyed!'));
    console.log(chalk.cyan(cities.length + ' Cities left out of the original ' + cityList.length));
    console.log(chalk.magenta(nrOfMoves + ' moves made by monsters'));
    const finalCityArray = createFinalListOfCities();
    if (finalCityArray.length > 0) {
      console.log(chalk.green('The final state of your world: '));
      console.log(finalCityArray);
    }
  }
  initiateWorld();
};

// Simple random index function pulled out here for ease
function pickRandomIndex (arr) {
  return Math.floor(Math.random() * arr.length);
}