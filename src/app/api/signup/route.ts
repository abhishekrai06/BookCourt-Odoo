import { NextRequest, NextResponse } from "next/server";
import { ServerCodes } from "@/app/constants/constants";
import bcrypt from "bcrypt";

import { ApiResponse } from "@/types/api-response";
import prisma from "@/lib/prisma";

const Joi = require("joi");
const postValidation = Joi.object({
	first_name: Joi.string().min(1).required().messages({
		"string.empty": "First name is required",
		"any.required": "First name is required",
	}),
	last_name: Joi.string().min(1).required().messages({
		"string.empty": "Last name is required",
		"any.required": "Last name is required",
	}),
	email: Joi.string().email().required().messages({
		"string.empty": "Email is required",
		"string.email": "Please provide a valid email address",
		"any.required": "Email is required",
	}),
	mobile: Joi.string()
		.pattern(/^[0-9]{10,15}$/)
		.required()
		.messages({
			"string.empty": "Mobile number is required",
			"string.pattern.base": "Mobile number must be 10 to 15 digits",
			"any.required": "Mobile number is required",
		}),
});

export async function POST(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	try {
		const requestData = await request.json();
		const { error, value } = postValidation.validate(requestData);
		if (error) {
			response.code = ServerCodes.ValidationError;
			response.message = error.details[0].message;
			return NextResponse.json(response, { status: 400 });
		}
		let existingUser;
		existingUser = await prisma.user.findUnique({
			where: {
				email: requestData.email,
			},
		});
		if (existingUser) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Email already exists.";
			return NextResponse.json(response, { status: 400 });
		}
		const { fullName, email, password } = value;
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await prisma.user.create({
			data: {
				fullName,
				email,
				password: hashedPassword,
				createdAt: Math.floor(Date.now() / 1000),
				updatedAt: Math.floor(Date.now() / 1000),
			},
		});
		response.code = ServerCodes.Success;
		response.message = "User added successfully";
		response.data = [newUser];
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		console.dir(error);
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
