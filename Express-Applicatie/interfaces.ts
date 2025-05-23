export interface Manufacturer {
    id: string;
    name: string;
    founder: string;
    foundedYear: number;
    motto: string;
}


export interface Car {
    id: string;
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
    releaseDate: string;
    imageUrl: string;
    category: string;
    features: string[];
    manufacturer: Manufacturer;
}
