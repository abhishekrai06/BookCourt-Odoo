import { NextRequest, NextResponse } from "next/server";
import { Constants, ServerCodes } from "@/app/constants/constants";
import jwt from "jsonwebtoken";

import { ApiResponse } from "@/types/api-response";
import { JwtPayload } from "@/types/jwt-payload";
import prisma from "@/lib/prisma";

const Joi = require("joi");
const postValidation = Joi.object({
	userId: Joi.string().required(),
	facilityId: Joi.string().required(),
	rating: Joi.number().min(1).max(5).required(),
	comment: Joi.string().allow("").optional(),
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
		// Only one review per user per facility
		const existing = await prisma.review.findUnique({
			where: { userId_facilityId: { userId: value.userId, facilityId: value.facilityId } },
		});
		if (existing) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "You have already reviewed this court.";
			return NextResponse.json(response, { status: 400 });
		}
		const review = await prisma.review.create({
			data: {
				userId: value.userId,
				facilityId: value.facilityId,
				rating: value.rating,
				comment: value.comment,
			},
		});
		response.code = ServerCodes.Success;
		response.message = "Review submitted successfully.";
		response.data = [review];
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	try {
		const facilityId = request.nextUrl.searchParams.get("facilityId");
		if (!facilityId) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "facilityId is required.";
			return NextResponse.json(response, { status: 400 });
		}
		const reviews = await prisma.review.findMany({
			where: { facilityId },
			include: { user: true },
			orderBy: { createdAt: "desc" },
		});
		// Calculate average rating
		const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : null;
		response.code = ServerCodes.Success;
		response.data = [{ reviews, avgRating }];
		response.message = "Reviews fetched successfully.";
		response.totalRecords = reviews.length;
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
