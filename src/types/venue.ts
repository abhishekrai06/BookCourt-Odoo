export interface Venue {
	id: string;
	ownerId: string;
	name: string;
	address: string;
	city: string;
	startingPricePerHour: number;
	rating: number;
	status: string;
	courts: Courts[];
	createdAt: number;
	updatedAt: number;
}

export interface Courts {
	id: string;
	facilityId: string;
	name: string;
	sport: string;
	pricePerHour: number;
	createdAt: number;
	updatedAt: number;
}
