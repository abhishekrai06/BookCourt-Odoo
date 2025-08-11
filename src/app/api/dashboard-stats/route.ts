import { NextResponse, type NextRequest } from "next/server";
import { Constants, ServerCodes } from "@/app/constants/constants";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { ApiResponse } from "@/types/api-response";
import { type DashboardStats } from "@/types/dashboard-stats";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	if (!authHeader) {
		response.code = ServerCodes.AuthError;
		response.message = "Authorization header is missing";
		return NextResponse.json(response);
	}
	const token = authHeader.split(" ")[1];
	if (!token) {
		response.code = ServerCodes.AuthError;
		response.message = "Token is not provided";
		return NextResponse.json(response, { status: 401 });
	}
	let userId, parentUserId;
	try {
		const data = jwt.verify(token, Constants.SECRET_JWT_KEY) as JwtPayload;
		if (data?.userId) {
			userId = data.userId;
			parentUserId = data.parentUserId;
		} else {
			response.code = ServerCodes.AuthError;
			response.message = "Authentication Failed";
			return NextResponse.json(response, { status: 401 });
		}
	} catch (e) {
		response.code = ServerCodes.AuthError;
		response.message = "Authentication Failed: Json decode failure";
		return NextResponse.json(response, { status: 401 });
	}

	try {
		// 1. Total Users
		const totalUsers = await prisma.user.count({
			where: { role: "USER" },
		});
		const totalOwners = await prisma.user.count({
			where: { role: "OWNER" },
		});

		// 2. Total Clients
		const totalVenues = await prisma.facility.count({});

		// 3. Total Proposals
		const totalBookings = await prisma.booking.count({});

		// Get the current year and last year
		const currentYear = new Date().getFullYear();
		const lastYear = currentYear - 1;

		// Function to get proposal count for each month of a given year
		const getDocCountsByYear = async (year: number, tableName: string) => {
			// Only allow trusted table names!
			if (tableName !== "booking") throw new Error("Invalid table name");
			// Use 'createdAt' column (DateTime) for booking creation date
			const docs = await prisma.$queryRawUnsafe<{ month: number | string; count: bigint | number }[]>(
				`
					SELECT 
						MONTH(createdAt) as month, 
						COUNT(*) as count 
					FROM ${tableName}
					WHERE YEAR(createdAt) = ?
					GROUP BY month
					ORDER BY month;
				`,
				year
			);

			const counts = Array(12).fill(0);
			docs.forEach((p) => {
				const monthIndex = Number(p.month ?? 1) - 1; // month is 1-indexed
				counts[monthIndex] = Number(p.count);
			});

			return counts;
		};
		// Get the proposal counts for the current year and last year
		const currentYearTransactionCounts = await getDocCountsByYear(currentYear, "booking");
		const lastYearTransactionCounts = await getDocCountsByYear(lastYear, "booking");
		const data: DashboardStats = {
			totalUsers,
			totalVenues,
			totalBookings,
			totalOwners,
			totalBookingCounts: {
				currentYear: currentYearTransactionCounts,
				lastYear: lastYearTransactionCounts,
			},
		};

		response.code = ServerCodes.Success;
		response.data = [data];
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		console.dir(error);
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 400 });
	}
}
