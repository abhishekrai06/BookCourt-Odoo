import { NextRequest, NextResponse } from "next/server";
import { ServerCodes } from "@/app/constants/constants";

import { ApiResponse } from "@/types/api-response";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	const response: ApiResponse = { code: ServerCodes.UnknownError };
	try {
		const token = request.nextUrl.searchParams.get("token");
		if (!token) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Verification token is required.";
			return NextResponse.json(response, { status: 400 });
		}
		const user = await prisma.user.findUnique({ where: { verificationToken: token } });
		if (!user) {
			response.code = ServerCodes.InvalidArgs;
			response.message = "Invalid or expired verification token.";
			return NextResponse.json(response, { status: 400 });
		}
		await prisma.user.update({
			where: { id: user.id },
			data: {
				emailVerifiedAt: new Date(),
				verificationToken: null,
			},
		});
		response.code = ServerCodes.Success;
		response.message = "Email verified successfully.";
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		response.code = ServerCodes.UnknownError;
		response.message = `Unknown Error (Code: ${response.code})`;
		return NextResponse.json(response, { status: 500 });
	}
}
