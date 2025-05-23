import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import {
    connectDB,
    fetchCarsFromDB,
    fetchManufacturersFromDB,
    findCarById,
    findManufacturerById,
    updateCar,
    updateManufacturer
} from './database';
import { Car, Manufacturer } from './interfaces'

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT ?? 3000);

app.get("/cars", async (req, res) => {
    const cars = await fetchCarsFromDB();
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
    const car = await findCarById(id);

    if (!car) {
        return res.status(404).render("error", { error: "Car not found" });
    }

    const manufacturer = await findManufacturerById(car.manufacturer.id);

    res.render("car-detail", {
        title: "Car Details",
        car: car,
        manufacturer: manufacturer
    });
});

// Show car edit form
app.get("/cars/:id/edit", async (req, res) => {
    const id = req.params.id;
    const car = await findCarById(id);
    const manufacturers = await fetchManufacturersFromDB();

    if (!car) {
        return res.status(404).render("error", { error: "Car not found" });
    }

    res.render("car-edit", {
        title: "Edit Car",
        car,
        manufacturers
    });
});

// Handle car edit form submission
app.post("/cars/:id/edit", async (req, res) => {
    const id = req.params.id;

    // Extract form data
    const updatedCar: Partial<Car> = {
        name: req.body.name,
        price: parseFloat(req.body.price),
        category: req.body.category,
        isAvailable: req.body.isAvailable === 'true',
        description: req.body.description
    };

    // Handle features as array
    if (req.body.features) {
        updatedCar.features = req.body.features.split(',').map((f: string) => f.trim());
    }

    // Update car in database
    const success = await updateCar(id, updatedCar);

    if (success) {
        res.redirect(`/cars/${id}`);
    } else {
        res.status(500).render("error", { error: "Failed to update car" });
    }
});

app.get("/manufacturers", async (req, res) => {
    const manufacturers = await fetchManufacturersFromDB();
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
    const manufacturer = await findManufacturerById(id);

    if (!manufacturer) {
        return res.status(404).render("error", { error: "Manufacturer not found" });
    }

    res.render("manufacturer-detail", {
        title: "Manufacturer Details",
        manufacturer
    });
});

app.get("/", async (req, res) => {
    const cars = await fetchCarsFromDB();
    res.render("index", {
        title: "Home",
        message: "Welkom bij de Auto Catalogus",
        cars
    });
});


// Start the server with database connection
async function startServer() {
    try {
        // Connect to MongoDB before starting the server
        await connectDB();

        app.listen(app.get("port"), () => {
            console.log(`Server started on http://localhost:${app.get("port")}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();