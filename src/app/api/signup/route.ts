import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { ServerCodes } from "@/app/constants/constants";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

import { ApiResponse } from "@/types/api-response";
import prisma from "@/lib/prisma";

const Joi = require("joi");
const postValidation = Joi.object({
	fullName: Joi.string().min(1).required().messages({
		"string.empty": "Full name is required",
		"any.required": "Full name is required",
	}),
	email: Joi.string().email().required().messages({
		"string.empty": "Email is required",
		"string.email": "Please provide a valid email address",
		"any.required": "Email is required",
	}),
	password: Joi.string().min(1).max(25).required().messages({
		"string.empty": "Password is required",
		"any.required": "Password is required",
	}),
	role: Joi.string().valid("USER", "OWNER", "ADMIN").required().messages({
		"string.empty": "Role is required",
		"any.required": "Role is required",
		"string.valid": "Role must be one of: USER, OWNER, ADMIN",
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
		const { fullName, email, password, role } = value;
		const hashedPassword = await bcrypt.hash(password, 10);
		// Generate a random verification token
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const newUser = await prisma.user.create({
			data: {
				fullName,
				email,
				password: hashedPassword,
				createdAt: Math.floor(Date.now() / 1000),
				updatedAt: Math.floor(Date.now() / 1000),
				role,
				verificationToken,
			},
		});

		// Send verification email
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.NEXT_PUBLIC_EMAIL_USER,
				pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
			},
		});
		const verifyUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/verify-email?token=${verificationToken}`;
		await transporter.sendMail({
			from: process.env.NEXT_PUBLIC_EMAIL_USER || "no-reply@bookcourt.com",
			to: email,
			subject: "Verify your email address",
			html: `<p>Hi ${fullName},</p><p>Thank you for signing up. Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
		});

		response.code = ServerCodes.Success;
		response.message = "User added successfully. Please check your email to verify your account.";
		response.data = [newUser];
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		console.dir(error);
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
