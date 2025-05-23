import { MongoClient, Collection, Db } from 'mongodb';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import bcrypt from "bcrypt";
import {Car, Manufacturer, User} from './interfaces'

dotenv.config();


// MongoDB connection
let client: MongoClient;
let db: Db;
const saltRounds: number = 10;
let carsCollection: Collection<Car>;
let manufacturersCollection: Collection<Manufacturer>;
let userCollection: Collection<User>;

// API URLs
const CARS_JSON = 'https://raw.githubusercontent.com/HoudaifaBO/cars-json/main/cars.json';
const MANUFACTURERS_JSON = 'https://raw.githubusercontent.com/HoudaifaBO/cars-json/main/manufacturer.json';

// Connect to MongoDB
export async function connectDB(): Promise<void> {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        client = new MongoClient(mongoURI);
        await client.connect();
        console.log('Connected to MongoDB');

        db = client.db('carCatalog'); // Use a specific database name
        carsCollection = db.collection<Car>('cars');
        manufacturersCollection = db.collection<Manufacturer>('manufacturers');
        userCollection = db.collection<User>('users');

        // Check if collections are empty and populate if needed
        await initializeData();
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Check if collections are empty and populate if needed
async function initializeData(): Promise<void> {
    const carsCount = await carsCollection.countDocuments();
    const manufacturersCount = await manufacturersCollection.countDocuments();

    if (carsCount === 0 || manufacturersCount === 0) {
        console.log('Database is empty. Fetching and storing data...');
        await populateDatabase();
    } else {
        console.log('Database already has data. Using existing data.');
    }
    
    // Add this line to create initial users
    await createInitialUsers();
}

// Fetch data from API and store in MongoDB
async function populateDatabase(): Promise<void> {
    try {
        // Fetch and store manufacturers
        const manufacturersResponse = await fetch(MANUFACTURERS_JSON);
        if (!manufacturersResponse.ok) {
            throw new Error('Failed to fetch manufacturers');
        }
        const manufacturersData = await manufacturersResponse.json() as Manufacturer[];

        if (manufacturersData.length > 0) {
            // Clear existing data if any
            await manufacturersCollection.deleteMany({});
            // Insert new data
            await manufacturersCollection.insertMany(manufacturersData);
            console.log(`Inserted ${manufacturersData.length} manufacturers into MongoDB`);
        }

        // Fetch and store cars
        const carsResponse = await fetch(CARS_JSON);
        if (!carsResponse.ok) {
            throw new Error('Failed to fetch cars');
        }
        const carsData = await carsResponse.json() as Car[];

        if (carsData.length > 0) {
            // Clear existing data if any
            await carsCollection.deleteMany({});
            // Insert new data
            await carsCollection.insertMany(carsData);
            console.log(`Inserted ${carsData.length} cars into MongoDB`);
        }

    } catch (error) {
        console.error('Error populating database:', error);
        throw error;
    }
}

export async function findUserByEmail(email: string) {
    return await userCollection.findOne({ email: email });
}


async function createInitialUsers() {
    if (await userCollection.countDocuments() > 0) { return; }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;

    if (!adminEmail || !adminPassword || !userEmail || !userPassword) {
        throw new Error("Admin and User email or password must be set in the environment");
    }

    const adminHash = await bcrypt.hash(adminPassword, saltRounds);
    const userHash = await bcrypt.hash(userPassword, saltRounds);

    await userCollection.insertMany([
        { email: adminEmail, password: adminHash, role: "ADMIN" },
        { email: userEmail, password: userHash, role: "USER" }
    ]);
}

export async function login(email: string, password: string) {
    if (email === "" || password === "") {
        throw new Error("Email and password required");
    }
    let user: User | null = await findUserByEmail(email);
    if (user) {
        if (user.password && await bcrypt.compare(password, user.password)) {
            return user;
        } else {
            throw new Error("Password incorrect");
        }
    } else {
        throw new Error("User not found");
    }
}

export async function register(email: string, password: string) {
    if (email === "" || password === "") {
        throw new Error("Email and password required");
    }
    
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error("User already exists");
    }
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser: User = {
        email: email,
        password: hashedPassword,
        role: "USER"
    };
    
    const result = await userCollection.insertOne(newUser);
    return result.insertedId;
}

// Functions to fetch data from MongoDB
export async function fetchCarsFromDB(): Promise<Car[]> {
    return await carsCollection.find({}).toArray();
}

export async function fetchManufacturersFromDB(): Promise<Manufacturer[]> {
    return await manufacturersCollection.find({}).toArray();
}

export async function findCarById(id: string): Promise<Car | null> {
    return await carsCollection.findOne({ id });
}

export async function findManufacturerById(id: string): Promise<Manufacturer | null> {
    return await manufacturersCollection.findOne({ id });
}

export async function updateCar(id: string, updatedData: Partial<Car>): Promise<boolean> {
    const result = await carsCollection.updateOne(
        { id },
        { $set: updatedData }
    );
    return result.modifiedCount > 0;
}

export async function updateManufacturer(id: string, updatedData: Partial<Manufacturer>): Promise<boolean> {
    const result = await manufacturersCollection.updateOne(
        { id },
        { $set: updatedData }
    );
    return result.modifiedCount > 0;
}
