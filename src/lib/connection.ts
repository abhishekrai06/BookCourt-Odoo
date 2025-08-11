import { Constants, ServerCodes } from "@/app/constants/constants";

import { ApiResponse } from "@/types/api-response";

import { authClient } from "./auth/client";

export async function postData(apiName: string, data: any, extraHeaders?: any): Promise<ApiResponse> {
	try {
		const url = Constants.baseURL + apiName;
		let finalHeaders: any = {
			"Content-Type": "application/json",
		};
		const token = authClient.getToken();
		if (token != null) {
			finalHeaders = { ...finalHeaders, Authorization: `Bearer ${token}` };
		}
		if (extraHeaders) {
			finalHeaders = { ...finalHeaders, extraHeaders };
		}
		const response = await fetch(url, {
			method: "POST",
			headers: finalHeaders,
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			if (errorData.code === ServerCodes.AuthError) {
				await authClient.signOut();
				window.location.reload();
			}
			const errorMessage = errorData?.message || "An error occurred while processing your request";
			console.error(errorMessage);
			return errorData;
		}

		const responseData: ApiResponse = await response.json();
		return responseData;
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error:", error.message);
			throw new Error(`Request failed: ${error.message}`);
		} else {
			console.error("Unknown error:", error);
			throw new Error("An unknown error occurred");
		}
	}
}

export async function getData(
	apiName: string,
	params: Record<string, string>,
	extraHeaders?: any
): Promise<ApiResponse> {
	try {
		const url = new URL(Constants.baseURL + apiName);
		Object.keys(params).forEach((key) => {
			url.searchParams.append(key, params[key]);
		});

		let finalHeaders: any = {
			"Content-Type": "application/json",
		};
		const token = authClient.getToken();
		if (token != null) {
			finalHeaders = { ...finalHeaders, Authorization: `Bearer ${token}` };
		}
		if (extraHeaders) {
			finalHeaders = { ...finalHeaders, extraHeaders };
		}
		const response = await fetch(url.toString(), {
			method: "GET",
			headers: finalHeaders,
		});

		if (!response.ok) {
			const errorData = await response.json();
			if (errorData.code === ServerCodes.AuthError) {
				await authClient.signOut();
				window.location.reload();
			}
			const errorMessage = errorData?.message || "An error occurred while processing your request";
			console.error(errorMessage);
			return errorData;
		}

		const responseData: ApiResponse = await response.json();
		return responseData;
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error:", error.message);
			throw new Error(`Request failed: ${error.message}`);
		} else {
			console.error("Unknown error:", error);
			throw new Error("An unknown error occurred");
		}
	}
}

export async function deleteData(apiName: string, data: any, extraHeaders?: any): Promise<ApiResponse> {
	try {
		const url = Constants.baseURL + apiName;
		let finalHeaders: any = {
			"Content-Type": "application/json",
		};
		const token = authClient.getToken();
		if (token != null) {
			finalHeaders = { ...finalHeaders, Authorization: `Bearer ${token}` };
		}
		if (extraHeaders) {
			finalHeaders = { ...finalHeaders, extraHeaders };
		}
		const response = await fetch(url, {
			method: "DELETE",
			headers: finalHeaders,
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			if (errorData.code === ServerCodes.AuthError) {
				await authClient.signOut();
				window.location.reload();
			}
			const errorMessage = errorData?.message || "An error occurred while processing your request";
			console.error(errorMessage);
			return errorData;
		}

		const responseData: ApiResponse = await response.json();
		return responseData;
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error:", error.message);
			throw new Error(`Request failed: ${error.message}`);
		} else {
			console.error("Unknown error:", error);
			throw new Error("An unknown error occurred");
		}
	}
}

export async function putData(apiName: string, data: any, extraHeaders?: any): Promise<ApiResponse> {
	try {
		const url = Constants.baseURL + apiName;
		let finalHeaders: any = {
			"Content-Type": "application/json",
		};
		const token = authClient.getToken();
		if (token != null) {
			finalHeaders = { ...finalHeaders, Authorization: `Bearer ${token}` };
		}
		if (extraHeaders) {
			finalHeaders = { ...finalHeaders, extraHeaders };
		}
		const response = await fetch(url, {
			method: "PUT",
			headers: finalHeaders,
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			if (errorData.code === ServerCodes.AuthError) {
				await authClient.signOut();
				window.location.reload();
			}
			const errorMessage = errorData?.message || "An error occurred while processing your request";
			console.error(errorMessage);
			return errorData;
		}

		const responseData: ApiResponse = await response.json();
		return responseData;
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error:", error.message);
			throw new Error(`Request failed: ${error.message}`);
		} else {
			console.error("Unknown error:", error);
			throw new Error("An unknown error occurred");
		}
	}
}
