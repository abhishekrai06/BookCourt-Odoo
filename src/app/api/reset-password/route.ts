import { NextResponse, type NextRequest } from "next/server";
import { Constants, ServerCodes } from "@/app/constants/constants";
import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { ApiResponse } from "@/types/api-response";
import prisma from "@/lib/prisma";

const Joi = require("joi");

const postValidation = Joi.object({
	old_password: Joi.string().min(1).max(25).required().messages({
		"string.empty": "Old password is required",
		"any.required": "Old password is required",
	}),
	new_password: Joi.string().min(1).max(25).required().messages({
		"string.empty": "New password is required",
		"any.required": "New password is required",
	}),
});

export async function POST(req: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	const authHeader = req.headers.get("authorization");

	if (!authHeader) {
		response.code = ServerCodes.AuthError;
		response.message = "Authorization header missing";
		return NextResponse.json(response, { status: 401 });
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
			// authorized
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
		const requestData = await req.json();
		const { error, value } = postValidation.validate(requestData);
		if (error) {
			response.code = ServerCodes.ValidationError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}

		const { old_password, new_password } = value;

		if (old_password === new_password) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "New password cannot be the same as the old password";
			return NextResponse.json(response, { status: 400 });
		}

		// Find the user by username
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "User not found";
			return NextResponse.json(response, { status: 404 });
		}

		// Check if the old password is correct
		const isPasswordValid = await bcrypt.compare(old_password, user.password);

		if (!isPasswordValid) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Invalid old password";
			return NextResponse.json(response, { status: 401 });
		}

		const hashedPassword = await bcrypt.hash(new_password, 10);

		await prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword },
		});
		response.code = ServerCodes.Success;
		response.message = "Password reset successful";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		console.error("Error resetting password:", error);
		response.code = ServerCodes.UnknownError;
		response.message = "Error resetting password";
		return NextResponse.json(response, { status: 400 });
	}
}
