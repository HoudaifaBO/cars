import { MongoClient, Collection, Db } from 'mongodb';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Type definitions
export interface Car {
    id: string;
    name: string;
    description?: string;
    price: number;
    isAvailable: boolean;
    releaseDate: string;
    imageUrl?: string;
    category: string;
    features: string[];
    manufacturer: {
        id: string;
        name: string;
        founder: string;
        foundedYear: number;
        motto: string;
    };
}

export interface Manufacturer {
    id: string;
    name: string;
    founder: string;
    foundedYear: number;
    motto: string;
    description?: string;
    logoUrl?: string;
}

// MongoDB connection
let client: MongoClient;
let db: Db;
let carsCollection: Collection<Car>;
let manufacturersCollection: Collection<Manufacturer>;

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

// Close the MongoDB connection (for graceful shutdown)
export async function closeDB(): Promise<void> {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
}