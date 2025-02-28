import * as readline from 'readline-sync';
import data from './cars.json';
import { Car, Manufacturer } from './interfaces.ts';




function displayMenu() {
    console.log('\nWelcome to the JSON data viewer!');
    console.log('1. View all data');
    console.log('2. Filter by ID');
    console.log('3. Exit');
}

function viewAllData() {
    console.log('\nAvailable Cars:');
    data.forEach(car => {
        console.log(`- ${car.name} (ID: ${car.id})`);
    });
}

function filterById() {
    let id = readline.question("\nEnter ID: ");
    let car = data.find((car: Car) => String(car.id) === id);

    if (car) {
        console.log(`\n- ${car.name} (ID: ${car.id})`);
        console.log(`  - Description: ${car.description}`);
        console.log(`  - Price: $${car.price}`);
        console.log(`  - Available: ${car.isAvailable ? 'Yes' : 'No'}`);
        console.log(`  - Release Date: ${car.releaseDate}`);
        console.log(`  - Category: ${car.category}`);
        console.log(`  - Features: ${car.features.join(', ')}`);
        console.log(`  - Manufacturer: ${car.manufacturer.name}`);
        console.log(`    - Founded: ${car.manufacturer.foundedYear}`);
        console.log(`    - Motto: ${car.manufacturer.motto}`);
    } else {
        console.log("\nCar with the given ID not found!");
    }
}

function main() {
    while (true) {
        displayMenu();
        let choice = readline.question("\nEnter your choice: ");
        switch (choice) {
            case '1':
                viewAllData();
                break;
            case '2':
                filterById();
                break;
            case '3':
                console.log('Exited');
                return;
            default:
                console.log('Invalid choice, please try again.');
        }
    }
}

main();