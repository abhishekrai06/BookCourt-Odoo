import { NextRequest, NextResponse } from "next/server";
import { Constants, ServerCodes } from "@/app/constants/constants";
import jwt from "jsonwebtoken";

import { ApiResponse } from "@/types/api-response";
import { JwtPayload } from "@/types/jwt-payload";
import prisma from "@/lib/prisma";

const Joi = require("joi");
const courtSchema = Joi.object({
	name: Joi.string().min(1).required().messages({
		"string.empty": "Court name is required",
		"any.required": "Court name is required",
	}),
	sport: Joi.string().valid("BADMINTON", "FOOTBALL", "TENNIS", "TABLE_TENNIS", "CRICKET").required().messages({
		"any.only": "Sport must be one of BADMINTON, FOOTBALL, TENNIS, TABLE_TENNIS, CRICKET",
		"any.required": "Sport is required",
	}),
	pricePerHour: Joi.number().min(0).required().messages({
		"number.base": "Price per hour must be a number",
		"number.min": "Price per hour must be at least 0",
		"any.required": "Price per hour is required",
	}),
});
const putValidation = Joi.object({
	id: Joi.string().required(),
	ownerId: Joi.string().required(),
	name: Joi.string().min(1).required(),
	address: Joi.string().min(1).required(),
	city: Joi.string().min(1).required(),
	startingPricePerHour: Joi.number().min(0).required(),
	courts: Joi.array()
		.items(
			Joi.object({
				id: Joi.string().optional(),
				name: Joi.string().min(1).required(),
				sport: Joi.string().valid("BADMINTON", "FOOTBALL", "TENNIS", "TABLE_TENNIS", "CRICKET").required(),
				pricePerHour: Joi.number().min(0).required(),
			})
		)
		.min(1)
		.required(),
});

const deleteValidation = Joi.object({
	id: Joi.string().required(),
});
const postValidation = Joi.object({
	name: Joi.string().min(1).required().messages({
		"string.empty": "Venue name is required",
		"any.required": "Venue name is required",
	}),
	address: Joi.string().min(1).required().messages({
		"string.empty": "Address is required",
		"any.required": "Address is required",
	}),
	city: Joi.string().min(1).required().messages({
		"string.empty": "City is required",
		"any.required": "City is required",
	}),
	startingPricePerHour: Joi.number().min(0).required().messages({
		"number.base": "Starting price per hour must be a number",
		"number.min": "Starting price per hour must be at least 0",
		"any.required": "Starting price per hour is required",
	}),
	courts: Joi.array().items(courtSchema).min(1).required().messages({
		"array.min": "At least one court is required",
		"any.required": "Courts are required",
	}),
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
	let userId, parentUserId;
	try {
		const data = jwt.verify(token, Constants.SECRET_JWT_KEY) as JwtPayload;
		if (data.userId) {
			userId = data.userId;
			parentUserId = data.parentUserId;
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
			console.dir(error);
			response.code = ServerCodes.ValidationError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}
		const existingVenue = await prisma.facility.findFirst({
			where: {
				ownerId: value.ownerId,
				name: value.name,
			},
		});
		if (existingVenue) {
			console.dir(error);
			response.code = ServerCodes.InvalidArgs;
			response.message = "Venue name already exists for this owner.";
			return NextResponse.json(response, { status: 400 });
		}
		// Transaction: create venue, then create courts with prisma.court.create
		const newVenue = await prisma.$transaction(async (tx) => {
			const facility = await tx.facility.create({
				data: {
					ownerId: userId,
					name: value.name,
					address: value.address,
					city: value.city,
					startingPricePerHour: value.startingPricePerHour,
					createdAt: Math.floor(Date.now() / 1000),
					updatedAt: Math.floor(Date.now() / 1000),
				},
			});
			const courts = await Promise.all(
				value.courts.map((court: any) =>
					tx.court.create({
						data: {
							facilityId: facility.id,
							name: court.name,
							sport: court.sport,
							pricePerHour: court.pricePerHour,
							createdAt: Math.floor(Date.now() / 1000),
							updatedAt: Math.floor(Date.now() / 1000),
						},
					})
				)
			);
			return { ...facility, courts };
		});
		response.code = ServerCodes.Success;
		response.message = "Venue added successfully";
		response.data = [newVenue];
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		console.dir(error);
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
export async function GET(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	try {
		const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
		const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "10", 10);
		const query = request.nextUrl.searchParams.get("query") || "";
		const skip = (page - 1) * pageSize;
		const id = request.nextUrl.searchParams.get("id");

		if (id) {
			const venue = await prisma.facility.findUnique({
				where: { id },
				include: { courts: true },
			});
			if (!venue) {
				response.code = ServerCodes.InvalidArgs;
				response.message = "Venue not found.";
				return NextResponse.json(response, { status: 400 });
			}
			response.code = ServerCodes.Success;
			response.data = [venue];
			response.message = "Venue details fetched successfully.";
			return NextResponse.json(response, { status: 200 });
		}

		const where: any = query ? { name: { contains: query } } : {};

		const totalCount = await prisma.facility.count({ where });
		const venues = await prisma.facility.findMany({
			skip,
			take: pageSize,
			where,
			include: { courts: true },
		});

		response.code = ServerCodes.Success;
		response.currentPage = page;
		response.pageSize = pageSize;
		response.totalPages = Math.ceil(totalCount / pageSize);
		response.totalRecords = totalCount;
		response.data = venues;
		response.message = "Venues fetched successfully.";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	try {
		const requestData = await request.json();
		const { error, value } = putValidation.validate(requestData);
		if (error) {
			response.code = ServerCodes.ValidationError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}

		const venueExists = await prisma.facility.findUnique({ where: { id: value.id } });
		if (!venueExists) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Venue does not exist.";
			return NextResponse.json(response, { status: 400 });
		}

		// Transaction: update venue and courts
		const updatedVenue = await prisma.$transaction(async (tx) => {
			const venue = await tx.facility.update({
				where: { id: value.id },
				data: {
					ownerId: value.ownerId,
					name: value.name,
					address: value.address,
					city: value.city,
					startingPricePerHour: value.startingPricePerHour,
					updatedAt: Math.floor(Date.now() / 1000),
				},
			});

			// Delete removed courts
			const incomingCourtIds = value.courts.filter((c: any) => c.id).map((c: any) => c.id);
			await tx.court.deleteMany({
				where: {
					facilityId: value.id,
					...(incomingCourtIds.length > 0 && { id: { notIn: incomingCourtIds } }),
				},
			});

			// Update existing courts
			for (const court of value.courts.filter((c: any) => c.id)) {
				await tx.court.update({
					where: { id: court.id },
					data: {
						name: court.name,
						sport: court.sport,
						pricePerHour: court.pricePerHour,
						updatedAt: Math.floor(Date.now() / 1000),
					},
				});
			}

			// Create new courts
			for (const court of value.courts.filter((c: any) => !c.id)) {
				await tx.court.create({
					data: {
						facilityId: value.id,
						name: court.name,
						sport: court.sport,
						pricePerHour: court.pricePerHour,
						createdAt: Math.floor(Date.now() / 1000),
						updatedAt: Math.floor(Date.now() / 1000),
					},
				});
			}

			const venueWithCourts = await tx.facility.findUnique({
				where: { id: value.id },
				include: { courts: true },
			});
			return venueWithCourts;
		});

		response.code = ServerCodes.Success;
		response.data = [updatedVenue];
		response.message = "Venue updated successfully.";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	try {
		const requestData = await request.json();
		const { error, value } = deleteValidation.validate(requestData);
		if (error) {
			response.code = ServerCodes.ValidationError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}
		const venueExists = await prisma.facility.findUnique({ where: { id: value.id } });
		if (!venueExists) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Venue does not exist.";
			return NextResponse.json(response, { status: 400 });
		}

		await prisma.court.deleteMany({ where: { facilityId: value.id } });
		await prisma.facility.delete({ where: { id: value.id } });

		response.code = ServerCodes.Success;
		response.message = "Venue deleted successfully.";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
