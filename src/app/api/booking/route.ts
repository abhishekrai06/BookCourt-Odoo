import { NextRequest, NextResponse } from "next/server";
import { Constants, ServerCodes } from "@/app/constants/constants";
import jwt from "jsonwebtoken";

import { ApiResponse } from "@/types/api-response";
import { JwtPayload } from "@/types/jwt-payload";
import prisma from "@/lib/prisma";

const Joi = require("joi");
const postValidation = Joi.object({
	userId: Joi.string().required(),
	courtId: Joi.string().required(),
	startsAt: Joi.date().required(),
	endsAt: Joi.date().required(),
	totalPrice: Joi.number().min(0).required(),
	status: Joi.string().valid("PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "COMPLETED").optional(),
});

const putValidation = Joi.object({
	id: Joi.string().required(),
	userId: Joi.string().required(),
	courtId: Joi.string().required(),
	startsAt: Joi.date().required(),
	endsAt: Joi.date().required(),
	totalPrice: Joi.number().min(0).required(),
	status: Joi.string().valid("PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "COMPLETED").optional(),
});

const deleteValidation = Joi.object({
	id: Joi.string().required(),
});

export async function POST(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	const authHeader = request.headers.get("authorization");
	if (!authHeader) {
		response.code = ServerCodes.AuthError;
		response.message = "Authorization header is missing";
		return NextResponse.json(response, { status: 400 });
	}
	const token = authHeader.split(" ")[1];
	if (!token) {
		response.code = ServerCodes.AuthError;
		response.message = "Token not provided.";
		return NextResponse.json(response, { status: 400 });
	}
	let userId;
	try {
		const data = jwt.verify(token, Constants.SECRET_JWT_KEY) as JwtPayload;
		if (data.userId) {
			userId = data.userId;
		} else {
			response.code = ServerCodes.AuthError;
			response.message = "Authentication failed";
			return NextResponse.json(response, { status: 400 });
		}
	} catch (error) {
		response.code = ServerCodes.AuthError;
		response.message = "Authentication failed. Json decode failure.";
		return NextResponse.json(response, { status: 500 });
	}
	try {
		const requestData = await request.json();
		const { error, value } = postValidation.validate(requestData);
		if (error) {
			response.code = ServerCodes.ValidationError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}
		// Check for overlapping bookings
		const overlap = await prisma.booking.findFirst({
			where: {
				courtId: value.courtId,
				startsAt: { lte: value.endsAt },
				endsAt: { gte: value.startsAt },
			},
		});
		if (overlap) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Court is already booked for the selected time.";
			return NextResponse.json(response, { status: 400 });
		}
		const booking = await prisma.booking.create({
			data: {
				userId: value.userId,
				courtId: value.courtId,
				startsAt: new Date(value.startsAt),
				endsAt: new Date(value.endsAt),
				totalPrice: value.totalPrice,
				status: value.status || "PENDING_PAYMENT",
			},
		});
		response.code = ServerCodes.Success;
		response.message = "Booking created successfully.";
		response.data = [booking];
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	const authHeader = request.headers.get("authorization");
	if (!authHeader) {
		response.code = ServerCodes.AuthError;
		response.message = "Authorization header is missing";
		return NextResponse.json(response, { status: 400 });
	}
	const token = authHeader.split(" ")[1];
	if (!token) {
		response.code = ServerCodes.AuthError;
		response.message = "Token not provided.";
		return NextResponse.json(response, { status: 400 });
	}
	let userId;
	try {
		const data = jwt.verify(token, Constants.SECRET_JWT_KEY) as JwtPayload;
		if (data.userId) {
			userId = data.userId;
		} else {
			response.code = ServerCodes.AuthError;
			response.message = "Authentication failed";
			return NextResponse.json(response, { status: 400 });
		}
	} catch (error) {
		response.code = ServerCodes.AuthError;
		response.message = "Authentication failed. Json decode failure.";
		return NextResponse.json(response, { status: 500 });
	}
	try {
		const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
		const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "10", 10);
		const userId = request.nextUrl.searchParams.get("userId") || "";
		const courtId = request.nextUrl.searchParams.get("courtId") || "";
		const id = request.nextUrl.searchParams.get("id");
		const skip = (page - 1) * pageSize;

		if (id) {
			const booking = await prisma.booking.findUnique({
				where: { id },
				include: { user: true, court: true },
			});
			if (!booking) {
				response.code = ServerCodes.InvalidArgs;
				response.message = "Booking not found.";
				return NextResponse.json(response, { status: 400 });
			}
			response.code = ServerCodes.Success;
			response.data = [booking];
			response.message = "Booking details fetched successfully.";
			return NextResponse.json(response, { status: 200 });
		}

		const where: any = {};
		if (userId) {
			where.userId = userId;
		}
		if (courtId) {
			where.courtId = courtId;
		}

		const totalCount = await prisma.booking.count({ where });
		const bookings = await prisma.booking.findMany({
			skip,
			take: pageSize,
			where,
			include: { user: true, court: true },
			orderBy: { startsAt: "desc" },
		});

		response.code = ServerCodes.Success;
		response.currentPage = page;
		response.pageSize = pageSize;
		response.totalPages = Math.ceil(totalCount / pageSize);
		response.totalRecords = totalCount;
		response.data = bookings;
		response.message = "Bookings fetched successfully.";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	const authHeader = request.headers.get("authorization");
	if (!authHeader) {
		response.code = ServerCodes.AuthError;
		response.message = "Authorization header is missing";
		return NextResponse.json(response, { status: 400 });
	}
	const token = authHeader.split(" ")[1];
	if (!token) {
		response.code = ServerCodes.AuthError;
		response.message = "Token not provided.";
		return NextResponse.json(response, { status: 400 });
	}
	let userId;
	try {
		const data = jwt.verify(token, Constants.SECRET_JWT_KEY) as JwtPayload;
		if (data.userId) {
			userId = data.userId;
		} else {
			response.code = ServerCodes.AuthError;
			response.message = "Authentication failed";
			return NextResponse.json(response, { status: 400 });
		}
	} catch (error) {
		response.code = ServerCodes.AuthError;
		response.message = "Authentication failed. Json decode failure.";
		return NextResponse.json(response, { status: 500 });
	}
	try {
		const requestData = await request.json();
		const { error, value } = putValidation.validate(requestData);
		if (error) {
			response.code = ServerCodes.ValidationError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}
		const bookingExists = await prisma.booking.findUnique({ where: { id: value.id } });
		if (!bookingExists) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Booking does not exist.";
			return NextResponse.json(response, { status: 400 });
		}
		// Check for overlapping bookings (excluding current)
		const overlap = await prisma.booking.findFirst({
			where: {
				courtId: value.courtId,
				id: { not: value.id },
				startsAt: { lte: value.endsAt },
				endsAt: { gte: value.startsAt },
			},
		});
		if (overlap) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Court is already booked for the selected time.";
			return NextResponse.json(response, { status: 400 });
		}
		const updatedBooking = await prisma.booking.update({
			where: { id: value.id },
			data: {
				userId: value.userId,
				courtId: value.courtId,
				startsAt: new Date(value.startsAt),
				endsAt: new Date(value.endsAt),
				totalPrice: value.totalPrice,
				status: value.status || "PENDING_PAYMENT",
			},
			include: { user: true, court: true },
		});
		response.code = ServerCodes.Success;
		response.data = [updatedBooking];
		response.message = "Booking updated successfully.";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	const authHeader = request.headers.get("authorization");
	if (!authHeader) {
		response.code = ServerCodes.AuthError;
		response.message = "Authorization header is missing";
		return NextResponse.json(response, { status: 400 });
	}
	const token = authHeader.split(" ")[1];
	if (!token) {
		response.code = ServerCodes.AuthError;
		response.message = "Token not provided.";
		return NextResponse.json(response, { status: 400 });
	}
	let userId;
	try {
		const data = jwt.verify(token, Constants.SECRET_JWT_KEY) as JwtPayload;
		if (data.userId) {
			userId = data.userId;
		} else {
			response.code = ServerCodes.AuthError;
			response.message = "Authentication failed";
			return NextResponse.json(response, { status: 400 });
		}
	} catch (error) {
		response.code = ServerCodes.AuthError;
		response.message = "Authentication failed. Json decode failure.";
		return NextResponse.json(response, { status: 500 });
	}
	try {
		const requestData = await request.json();
		const { error, value } = deleteValidation.validate(requestData);
		if (error) {
			response.code = ServerCodes.ValidationError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}
		const bookingExists = await prisma.booking.findUnique({ where: { id: value.id } });
		if (!bookingExists) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Booking does not exist.";
			return NextResponse.json(response, { status: 400 });
		}
		await prisma.booking.delete({ where: { id: value.id } });
		response.code = ServerCodes.Success;
		response.message = "Booking deleted successfully.";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
