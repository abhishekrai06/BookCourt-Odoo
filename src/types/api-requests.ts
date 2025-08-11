import { Courts } from "./venue";

export interface SignUpRequestData {
	fullName: string;
	email: string;
	password: string;
	role: string;
}
export interface VenueDeleteRequestData {
	id: string;
}
export interface VenuePostRequestData {
	name: string;
	address: string;
	city: string;
	startingPricePerHour: number;
	courts: VenueCourts[];
}

export interface VenueCourts {
	name: string;
	sport: string;
	pricePerHour: number;
}

export interface VenuePutRequestData {
	id: string;
	name: string;
	address: string;
	city: string;
	startingPricePerHour: number;
	courts: Courts[];
}
