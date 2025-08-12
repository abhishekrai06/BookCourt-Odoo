import { NextRequest, NextResponse } from "next/server";
import { Constants, ServerCodes } from "@/app/constants/constants";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { ApiResponse } from "@/types/api-response";
import prisma from "@/lib/prisma";

const Joi = require("joi");
const postValidation = Joi.object({
	email: Joi.string().email().required().messages({
		"string.empty": "Email is required",
		"string.email": "Please provide a valid email address",
		"any.required": "Email is required",
	}),
	password: Joi.string().min(1).required().messages({
		"string.empty": "Password is required",
		"any.required": "Password is required",
	}),
});

export async function POST(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	try {
		const requestData = await request.json();
		const { error, value } = postValidation.validate(requestData);
		if (error) {
			response.code = ServerCodes.AuthError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}
		const { email, password } = value;
		let user;
		user = await prisma.user.findUnique({
			where: { email },
		});
		if (!user) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "User not found";
			return NextResponse.json(response, { status: 400 });
		}
		if (user.banned) {
			response.code = ServerCodes.AuthError;
			response.message = "Your account has been banned. Please contact support.";
			return NextResponse.json(response, { status: 403 });
		}
		if (!user.emailVerifiedAt) {
			response.code = ServerCodes.AuthError;
			response.message = "Please verify your email address.";
			return NextResponse.json(response, { status: 403 });
		}
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Incorrect Password.";
			return NextResponse.json(response, { status: 400 });
		}
		const token = jwt.sign(
			{
				userId: user.id,
				accountType: user.role,
			},
			Constants.SECRET_JWT_KEY,
			{ expiresIn: "24h" }
		);
		response.code = ServerCodes.Success;
		response.message = "User logged in successfully.";
		response.data = [{ token, user }];
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
