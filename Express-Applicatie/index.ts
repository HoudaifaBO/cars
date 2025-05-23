import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";
import { Manufacturer, Car } from '../interfaces'

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT ?? 3000);

const Cars_JSON = 'https://raw.githubusercontent.com/HoudaifaBO/cars-json/main/cars.json';
const Manufacturers_JSON = 'https://raw.githubusercontent.com/HoudaifaBO/cars-json/main/manufacturer.json';

async function fetchCars(): Promise<Car[]> {
    const response = await fetch(Cars_JSON);
    if (!response.ok) {
        throw new Error("Failed to fetch cars");
    }
    const data: Car[] = await response.json() as Car[];
    return data;
}

async function fetchManufacturers(): Promise<Manufacturer[]> {
    const response = await fetch(Manufacturers_JSON);
    if (!response.ok) {
        throw new Error("Failed to fetch manufacturers");
    }
    const data: Manufacturer[] = await response.json() as Manufacturer[];
    return data;
}

app.get("/cars", async (req, res) => {
    const cars = await fetchCars();
    const nameFilter = req.query.name?.toString().toLowerCase();
    const sortBy = req.query.sortBy?.toString();
    const sortOrder = req.query.sortOrder?.toString()?.toLowerCase() === 'desc' ? 'desc' : 'asc';

    let filteredCars = nameFilter
        ? cars.filter(car => car.name.toLowerCase().includes(nameFilter))
        : cars;

    if (sortBy && filteredCars.length > 0 && sortBy in filteredCars[0]) {
        filteredCars.sort((a, b) => {
            if (typeof a[sortBy as keyof Car] === 'string') {
                const strA = (a[sortBy as keyof Car] as string).toLowerCase();
                const strB = (b[sortBy as keyof Car] as string).toLowerCase();
                return sortOrder === 'asc'
                    ? strA.localeCompare(strB)
                    : strB.localeCompare(strA);
            }
            else {
                const valueA = a[sortBy as keyof Car];
                const valueB = b[sortBy as keyof Car];
                return sortOrder === 'asc'
                    ? Number(valueA) - Number(valueB)
                    : Number(valueB) - Number(valueA);
            }
        });
    }
    res.render("cars", {
        title: "Cars",
        cars: filteredCars,
        filters: { name: nameFilter, sortBy, sortOrder }
    });
});

app.get("/cars/:id", async (req, res) => {
    const id = req.params.id;
    const cars = await fetchCars();
    const car = cars.find(car => car.id === id);
    if (!car) {
        return res.status(404).json({ error: "Car not found" });
    }
    const manufacturers = await fetchManufacturers();
    const manufacturer = manufacturers.find(manufacturer => manufacturer.id === car.manufacturer.id);
    res.render("car-detail", {
        title: "Cars",
        car: car,
        manufacturer: manufacturer
    });
});


app.get("/manufacturers", async (req, res) => {
    const manufacturers = await fetchManufacturers();
    const nameFilter = req.query.name?.toString().toLowerCase();
    const sortBy = req.query.sortBy?.toString();
    const sortOrder = req.query.sortOrder?.toString()?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    let filteredManufacturers = nameFilter
        ? manufacturers.filter(manufacturer => manufacturer.name.toLowerCase().includes(nameFilter))
        : manufacturers;
    if (sortBy && filteredManufacturers.length > 0 && sortBy in filteredManufacturers[0]) {
        filteredManufacturers.sort((a, b) => {
            if (typeof a[sortBy as keyof Manufacturer] === 'string') {
                const strA = (a[sortBy as keyof Manufacturer] as string).toLowerCase();
                const strB = (b[sortBy as keyof Manufacturer] as string).toLowerCase();
                return sortOrder === 'asc'
                    ? strA.localeCompare(strB)
                    : strB.localeCompare(strA);
            }
            else {
                const valueA = a[sortBy as keyof Manufacturer];
                const valueB = b[sortBy as keyof Manufacturer];
                return sortOrder === 'asc'
                    ? Number(valueA) - Number(valueB)
                    : Number(valueB) - Number(valueA);
            }
        });
    }
    res.render("manufacturers", {
        title: "Manufacturers",
        manufacturers: filteredManufacturers,
        filters: { name: nameFilter, sortBy, sortOrder }
    });
});

app.get("/manufacturers/:id", async (req, res) => {
    const id = req.params.id;
    const manufacturers = await fetchManufacturers();
    const manufacturer = manufacturers.find(manufacturer => manufacturer.id === id);
    if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" });
    }
    res.render("manufacturer-detail", { manufacturer });
});


app.get("/", async (req, res) => {
    const cars = await fetchCars();
    res.render("index", { title: "Home", message: "Welcome to the Car App", cars });
});


app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get("port"));
});