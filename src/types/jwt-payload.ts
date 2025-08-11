export interface JwtPayload {
	userId: string;
	int?: number;
	exp?: number;
	parentUserId: string;
}
