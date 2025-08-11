import { NextRequest, NextResponse } from "next/server";
import { ServerCodes } from "@/app/constants/constants";

import { ApiResponse } from "@/types/api-response";
import prisma from "@/lib/prisma";

const Joi = require("joi");

const putValidation = Joi.object({
	id: Joi.string().required(),
	banned: Joi.boolean().required(),
});

export async function GET(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	try {
		const role = request.nextUrl.searchParams.get("role");
		const where: any = {};
		if (role && ["USER", "OWNER", "ADMIN"].includes(role)) {
			where.role = role;
		}
		const users = await prisma.user.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});
		response.code = ServerCodes.Success;
		response.data = users;
		response.message = "Users fetched successfully.";
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
		const user = await prisma.user.findUnique({ where: { id: value.id } });
		if (!user) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "User not found.";
			return NextResponse.json(response, { status: 400 });
		}
		const updatedUser = await prisma.user.update({
			where: { id: value.id },
			data: { banned: value.banned },
		});
		response.code = ServerCodes.Success;
		response.data = [updatedUser];
		response.message = value.banned ? "User banned successfully." : "User unbanned successfully.";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
