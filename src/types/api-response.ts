export interface ApiResponse {
	code: number;
	data?: any[];
	message?: string;
	totalPages?: number;
	currentPage?: number;
	pageSize?: number;
	totalRecords?: number;
}
