export interface DashboardStats {
	totalUsers: number;
	totalOwners: number;
	totalVenues: number;
	totalBookings: number;
	totalBookingCounts: DocCounts;
}

interface DocCounts {
	currentYear: number[];
	lastYear: number[];
}
