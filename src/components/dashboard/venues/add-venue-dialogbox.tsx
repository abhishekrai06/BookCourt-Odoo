"use client";

import React from "react";
import { ApiNames, ServerCodes } from "@/app/constants/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	MenuItem,
	Paper,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useFieldArray, useForm } from "react-hook-form";
import { z as zod } from "zod";

import { VenuePostRequestData, VenuePutRequestData } from "@/types/api-requests";
import { ApiResponse } from "@/types/api-response";
import { Venue } from "@/types/venue";
import { postData, putData } from "@/lib/connection";
import { useToast } from "@/contexts/toast-context";

interface ClientFormDialogProps {
	open: boolean;
	onClose: () => void;
	venue?: Venue;
	onAddVenue?: (venue?: Venue) => void;
}

const SPORT_OPTIONS = [
	{ value: "BADMINTON", label: "Badminton" },
	{ value: "FOOTBALL", label: "Football" },
	{ value: "TENNIS", label: "Tennis" },
	{ value: "TABLE_TENNIS", label: "Table Tennis" },
	{ value: "CRICKET", label: "Cricket" },
];

const courtSchema = zod.object({
	name: zod.string().min(1, { message: "Court name is required" }),
	sport: zod.enum(["BADMINTON", "FOOTBALL", "TENNIS", "TABLE_TENNIS", "CRICKET"], { message: "Sport is required" }),
	pricePerHour: zod.number().min(0, { message: "Price per hour is required" }),
});

const schema = zod.object({
	name: zod.string().min(1, { message: "Venue name is required" }),
	address: zod.string().min(1, { message: "Address is required" }),
	city: zod.string().min(1, { message: "City is required" }),
	startingPricePerHour: zod.number().min(0, { message: "Starting price per hour is required" }),
	courts: zod.array(courtSchema).min(1, { message: "At least one court is required" }),
});

type Values = zod.infer<typeof schema>;

const defaultValues: Values = {
	name: "",
	address: "",
	city: "",
	startingPricePerHour: 0,
	courts: [],
};

const AddVenueDialogBox: React.FC<{
	open: boolean;
	onClose: () => void;
	venue?: Venue;
	onAddVenue?: (venue?: Values) => void;
}> = ({ open, onClose, venue, onAddVenue }) => {
	const [isPending, setIsPending] = React.useState(false);
	const { showToast } = useToast();

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<Values>({
		defaultValues: venue
			? {
					name: venue.name,
					address: venue.address,
					city: venue.city,
					startingPricePerHour: venue.startingPricePerHour,
					courts:
						venue.courts?.map((court) => ({
							name: court.name,
							sport: court.sport as "BADMINTON" | "FOOTBALL" | "TENNIS" | "TABLE_TENNIS" | "CRICKET",
							pricePerHour: court.pricePerHour,
						})) ?? [],
				}
			: defaultValues,
		resolver: zodResolver(schema),
	});

	const {
		fields: courts,
		append,
		remove,
	} = useFieldArray({
		control,
		name: "courts",
	});

	const updateVenue = async (requestData: VenuePutRequestData) => {
		const response: ApiResponse = await putData(ApiNames.Venue, requestData);
		if (response.code !== ServerCodes.Success) {
			return { error: response.message, data: [] };
		}
		let venue: Venue[] = [];
		if (response.data) {
			venue = response.data.map((item): Venue => ({ ...item }));
		}
		return { data: venue };
	};
	const createVenue = async (requestData: VenuePostRequestData) => {
		const response: ApiResponse = await postData(ApiNames.Venue, requestData);
		if (response.code !== ServerCodes.Success) {
			return { error: response.message, data: [] };
		}
		let venue: Venue[] = [];
		if (response.data) {
			venue = response.data.map((item): Venue => ({ ...item }));
		}
		return { data: venue };
	};
	const onSubmit = React.useCallback(
		async (values: Values): Promise<void> => {
			setIsPending(true);
			let result;
			if (venue) {
				const filteredCourts = values.courts?.filter((c) => c.name && c.name.trim() !== "") || [];
				const mappedCourts = filteredCourts.map((court, idx) => {
					const existingCourt = venue.courts?.[idx];
					return {
						id: existingCourt?.id ?? "",
						facilityId: existingCourt?.facilityId ?? venue.id,
						createdAt: existingCourt?.createdAt ?? Math.floor(Date.now() / 1000),
						updatedAt: Math.floor(Date.now() / 1000),
						name: court.name,
						sport: court.sport,
						pricePerHour: court.pricePerHour,
					};
				});
				const requestData: VenuePutRequestData = {
					id: venue.id,
					name: values.name,
					address: values.address,
					city: values.city,
					startingPricePerHour: values.startingPricePerHour,
					courts: mappedCourts,
				};

				result = await updateVenue(requestData);
			} else {
				const filteredCourts = values.courts?.filter((c) => c.name && c.name.trim() !== "") || [];
				const mappedCourts = filteredCourts.map((court) => ({
					name: court.name,
					sport: court.sport,
					pricePerHour: court.pricePerHour,
				}));
				const requestData: VenuePostRequestData = {
					name: values.name,
					address: values.address,
					city: values.city,
					startingPricePerHour: values.startingPricePerHour,
					courts: mappedCourts,
				};
				result = await createVenue(requestData);
			}
			if (result.error) {
				showToast(result.error, "error");
				setIsPending(false);
				return;
			}
			setIsPending(false);
			if (onAddVenue != null) {
				onAddVenue(
					result.data.length > 0
						? {
								name: result.data[0].name,
								address: result.data[0].address,
								city: result.data[0].city,
								startingPricePerHour: result.data[0].startingPricePerHour,
								courts:
									result.data[0].courts?.map((court) => ({
										name: court.name,
										sport: court.sport as "BADMINTON" | "FOOTBALL" | "TENNIS" | "TABLE_TENNIS" | "CRICKET",
										pricePerHour: court.pricePerHour,
									})) ?? [],
							}
						: undefined
				);
			}
			showToast("Venue details updated successfully", "success");
			onClose();
			reset();
		},
		[showToast, onClose, reset]
	);

	const onDialogDismissed = () => {
		onClose();
		reset();
	};

	return (
		<Dialog open={open} onClose={onDialogDismissed} fullWidth maxWidth="sm">
			<DialogTitle>Add Venue</DialogTitle>
			<form onSubmit={handleSubmit(onSubmit)} noValidate>
				<DialogContent>
					{/* Venue Basics */}
					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
							Venue Details
						</Typography>
						<Stack spacing={2}>
							<TextField
								label="Venue Name"
								fullWidth
								{...register("name")}
								error={!!errors.name}
								helperText={errors.name?.message}
							/>
							<TextField
								label="Address"
								fullWidth
								{...register("address")}
								error={!!errors.address}
								helperText={errors.address?.message}
							/>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
								<TextField
									label="City"
									fullWidth
									{...register("city")}
									error={!!errors.city}
									helperText={errors.city?.message}
								/>
								<TextField
									label="Starting Price Per Hour"
									type="number"
									fullWidth
									{...register("startingPricePerHour", { valueAsNumber: true })}
									error={!!errors.startingPricePerHour}
									helperText={errors.startingPricePerHour?.message}
								/>
							</Stack>
						</Stack>
					</Paper>

					{/* Courts */}
					<Paper variant="outlined" sx={{ p: 2 }}>
						<Stack
							direction={{ xs: "column", sm: "row" }}
							alignItems={{ xs: "stretch", sm: "center" }}
							justifyContent="space-between"
							spacing={2}
							sx={{ mb: 2 }}
						>
							<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
								Courts
							</Typography>
							<Button variant="outlined" onClick={() => append({ name: "", sport: "BADMINTON", pricePerHour: 0 })}>
								Add Court
							</Button>
						</Stack>

						<Stack spacing={2}>
							{courts.map((field, index) => (
								<Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
									<Stack spacing={2}>
										<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
											<TextField
												label="Court Name"
												fullWidth
												{...register(`courts.${index}.name` as const)}
												error={!!errors.courts?.[index]?.name}
												helperText={errors.courts?.[index]?.name?.message}
											/>
											<TextField
												label="Sport"
												select
												fullWidth
												{...register(`courts.${index}.sport` as const)}
												error={!!errors.courts?.[index]?.sport}
												helperText={errors.courts?.[index]?.sport?.message}
											>
												{SPORT_OPTIONS.map((option) => (
													<MenuItem key={option.value} value={option.value}>
														{option.label}
													</MenuItem>
												))}
											</TextField>
											<TextField
												label="Price Per Hour"
												type="number"
												fullWidth
												{...register(`courts.${index}.pricePerHour`, {
													valueAsNumber: true,
												})}
												error={!!errors.courts?.[index]?.pricePerHour}
												helperText={errors.courts?.[index]?.pricePerHour?.message}
											/>
										</Stack>

										<Box display="flex" justifyContent="flex-end">
											<Button color="secondary" onClick={() => remove(index)}>
												Remove
											</Button>
										</Box>
									</Stack>
								</Paper>
							))}

							{errors.courts?.root?.message && <Typography color="error">{errors.courts.root.message}</Typography>}
						</Stack>
					</Paper>
				</DialogContent>

				<Divider />

				<DialogActions sx={{ p: 2 }}>
					<Button color="secondary" onClick={onDialogDismissed}>
						Cancel
					</Button>
					<Button type="submit" color="primary" disabled={isPending} variant="contained">
						{isPending ? "Submitting..." : "Submit"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default AddVenueDialogBox;
