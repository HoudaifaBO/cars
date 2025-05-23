import { ObjectId } from "mongodb";

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

  export interface User{
    _id?: ObjectId;
    role : "ADMIN" | "USER";
    email : string;
    password? : string;
  }