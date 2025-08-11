"use client";

import * as React from "react";
import { ApiNames, ServerCodes } from "@/app/constants/constants";
import { Box, Card, CardContent, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";

import { DashboardStats } from "@/types/dashboard-stats";
import { Venue } from "@/types/venue";
import { getData, postData } from "@/lib/connection";
import { useToast } from "@/contexts/toast-context";

export function OverviewLayout(): React.JSX.Element {
	const [role, setRole] = React.useState<string | null | undefined>();
	const [ownerVenues, setOwnerVenues] = React.useState<Venue[]>([]);
	const [ownerBookingCount, setOwnerBookingCount] = React.useState<number>(0);
	const [dashboardStats, setDashboardStats] = React.useState<DashboardStats>({
		totalUsers: 0,
		totalOwners: 0,
		totalVenues: 0,
		totalBookings: 0,
		totalBookingCounts: { currentYear: [], lastYear: [] },
	});
	const [venues, setVenues] = React.useState<Venue[]>([]);
	const [search, setSearch] = React.useState("");
	const [city, setCity] = React.useState("");
	const [bookingDialog, setBookingDialog] = React.useState<{ open: boolean; court?: any; venue?: any }>({
		open: false,
	});
	const [bookingForm, setBookingForm] = React.useState({ startsAt: "", endsAt: "" });
	const [isBooking, setIsBooking] = React.useState(false);

	const { showToast } = useToast();

	React.useEffect(() => {
		try {
			const stored = localStorage.getItem("user");
			if (stored) {
				const parsed = JSON.parse(stored);
				setRole(parsed.role ?? null);
				if (parsed.role === "OWNER") {
					fetchOwnerVenues(parsed.id);
				}
			} else {
				setRole(null);
			}
		} catch {
			setRole(null);
		}
	}, []);

	const fetchOwnerVenues = async (ownerId: string) => {
		try {
			const response = await getData(ApiNames.Venue, { page: "1", pageSize: "50", ownerId });
			if (response.code === ServerCodes.Success && Array.isArray(response.data)) {
				setOwnerVenues(response.data);
			} else {
				setOwnerVenues([]);
			}
		} catch {
			setOwnerVenues([]);
		}
	};

	React.useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			const response = await getData(ApiNames.DashboardStats, {});
			if (response.code === ServerCodes.Success && response.data) {
				setDashboardStats(response.data[0] ?? dashboardStats);
			}
		} catch (err) {}
	};
	React.useEffect(() => {
		const fetchVenues = async () => {
			const params: Record<string, string> = { page: "1", pageSize: "50" };
			if (search) params.query = search;
			if (city) params.city = city;
			const response = await getData(ApiNames.Venue, params);
			if (response.code === ServerCodes.Success && Array.isArray(response.data)) {
				setVenues(response.data);
			} else {
				setVenues([]);
			}
		};
		fetchVenues();
	}, [search, city]);
	// --- Enhanced logic: show booking info for courts already booked by user ---
	const [userBookings, setUserBookings] = React.useState<any[]>([]);

	React.useEffect(() => {
		const fetchUserBookings = async () => {
			const user = JSON.parse(localStorage.getItem("user") || "{}");
			if (!user.id) return;
			const response = await getData(ApiNames.Booking, { userId: user.id, page: "1", pageSize: "100" });
			if (response.code === ServerCodes.Success && Array.isArray(response.data)) {
				setUserBookings(response.data);
			} else {
				setUserBookings([]);
			}
		};
		fetchUserBookings();
	}, [venues]);
	if (role === "USER") {
		const handleBookCourt = async () => {
			if (!bookingDialog.court || !bookingForm.startsAt || !bookingForm.endsAt) return;
			setIsBooking(true);
			try {
				const user = JSON.parse(localStorage.getItem("user") || "{}");
				const totalHours =
					(new Date(bookingForm.endsAt).getTime() - new Date(bookingForm.startsAt).getTime()) / (1000 * 60 * 60);
				const totalPrice = Math.round(totalHours * bookingDialog.court.pricePerHour);
				const payload = {
					userId: user.id,
					courtId: bookingDialog.court.id,
					startsAt: bookingForm.startsAt,
					endsAt: bookingForm.endsAt,
					totalPrice,
				};
				const response = await postData(ApiNames.Booking, payload);
				if (response.code === ServerCodes.Success) {
					showToast("Court booked successfully!", "success");
					setBookingDialog({ open: false });
				} else {
					showToast(response.message || "Booking failed", "error");
				}
			} catch (err) {
				showToast("Booking failed", "error");
			}
			setIsBooking(false);
		};

		return (
			<Stack spacing={3} mt={2}>
				<Card
					elevation={3}
					sx={{ background: "linear-gradient(90deg,#1976d2 0%,#42a5f5 100%)", borderRadius: "16px", boxShadow: 3 }}
				>
					<CardContent>
						<Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#fff" }}>
							Welcome, {JSON.parse(localStorage.getItem("user") || "{}").fullName || "User"}!
						</Typography>
						<Typography variant="body1" sx={{ color: "#e3f2fd" }}>
							You can view all venues and book courts below. Your bookings will be highlighted.
						</Typography>
					</CardContent>
				</Card>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
					<input
						type="text"
						placeholder="Search Venue"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						style={{
							padding: "12px",
							borderRadius: "8px",
							border: "1px solid #1976d2",
							fontSize: "1rem",
							width: "100%",
						}}
					/>
					<input
						type="text"
						placeholder="City"
						value={city}
						onChange={(e) => setCity(e.target.value)}
						style={{
							padding: "12px",
							borderRadius: "8px",
							border: "1px solid #1976d2",
							fontSize: "1rem",
							width: "100%",
						}}
					/>
				</Stack>
				<Stack spacing={3}>
					{venues.map((venue) => (
						<Card key={venue.id} sx={{ borderRadius: "16px", boxShadow: 2, background: "#fff" }}>
							<CardContent>
								<Typography variant="h5" sx={{ color: "#1976d2", fontWeight: "bold" }}>
									{venue.name}
								</Typography>
								<Typography color="text.secondary" sx={{ fontSize: "1.1rem" }}>
									{venue.city}
								</Typography>
								<Typography color="text.secondary" sx={{ fontSize: "1.1rem" }}>
									Starting at ₹{venue.startingPricePerHour} /hr
								</Typography>
								<Typography variant="subtitle1" sx={{ mt: 2, color: "#1976d2", fontWeight: "bold" }}>
									Courts:
								</Typography>
								<List>
									{(venue.courts || []).map((court: any) => {
										const booking = userBookings.find((b) => b.courtId === court.id);
										return (
											<ListItem
												key={court.id}
												sx={{
													display: "flex",
													alignItems: "center",
													background: booking ? "#e3f2fd" : "inherit",
													borderRadius: "8px",
													mb: 1,
												}}
											>
												<ListItemText
													primary={
														<span style={{ fontWeight: "bold", color: booking ? "#1976d2" : "#333" }}>
															{court.name} ({court.sport})
														</span>
													}
													secondary={
														<span style={{ color: booking ? "#1976d2" : "#555" }}>Price: ₹{court.pricePerHour}/hr</span>
													}
												/>
												{booking ? (
													<Box sx={{ ml: 2, p: 2, background: "#bbdefb", borderRadius: "8px", minWidth: 220 }}>
														<Typography variant="body2" sx={{ color: "#1976d2", fontWeight: "bold" }}>
															Your Booking
														</Typography>
														<Typography variant="body2">
															Start: {new Date(booking.startsAt).toLocaleString()}
														</Typography>
														<Typography variant="body2">End: {new Date(booking.endsAt).toLocaleString()}</Typography>
														<Typography variant="body2">Status: {booking.status}</Typography>
														<Typography variant="body2">Total: ₹{booking.totalPrice}</Typography>
													</Box>
												) : (
													<button
														style={{
															marginLeft: "16px",
															padding: "10px 24px",
															borderRadius: "8px",
															background: "linear-gradient(90deg,#1976d2 0%,#42a5f5 100%)",
															color: "#fff",
															border: "none",
															fontWeight: "bold",
															fontSize: "1rem",
															cursor: "pointer",
															boxShadow: "0 2px 8px rgba(25,118,210,0.15)",
															transition: "background 0.3s",
														}}
														onClick={() => setBookingDialog({ open: true, court, venue })}
													>
														Book
													</button>
												)}
											</ListItem>
										);
									})}
									{(venue.courts || []).length === 0 && (
										<ListItem>
											<ListItemText primary="No courts available." />
										</ListItem>
									)}
								</List>
							</CardContent>
						</Card>
					))}
				</Stack>
				{bookingDialog.open && bookingDialog.court && (
					<Card
						elevation={6}
						sx={{ maxWidth: 400, mx: "auto", mt: 2, borderRadius: "16px", boxShadow: 4, background: "#e3f2fd" }}
					>
						<CardContent>
							<Typography variant="h6" gutterBottom sx={{ color: "#1976d2", fontWeight: "bold" }}>
								Book Court: {bookingDialog.court.name} ({bookingDialog.court.sport})
							</Typography>
							<Typography color="text.secondary" gutterBottom>
								Venue: {bookingDialog.venue?.name}
							</Typography>
							<Stack spacing={2}>
								<input
									type="datetime-local"
									value={bookingForm.startsAt}
									onChange={(e) => setBookingForm((f) => ({ ...f, startsAt: e.target.value }))}
									style={{ padding: "10px", borderRadius: "8px", border: "1px solid #1976d2", fontSize: "1rem" }}
								/>
								<input
									type="datetime-local"
									value={bookingForm.endsAt}
									onChange={(e) => setBookingForm((f) => ({ ...f, endsAt: e.target.value }))}
									style={{ padding: "10px", borderRadius: "8px", border: "1px solid #1976d2", fontSize: "1rem" }}
								/>
								<button
									style={{
										padding: "10px 24px",
										borderRadius: "8px",
										background: "linear-gradient(90deg,#1976d2 0%,#42a5f5 100%)",
										color: "#fff",
										border: "none",
										fontWeight: "bold",
										fontSize: "1rem",
										cursor: "pointer",
										boxShadow: "0 2px 8px rgba(25,118,210,0.15)",
										transition: "background 0.3s",
									}}
									onClick={handleBookCourt}
									disabled={isBooking}
								>
									{isBooking ? "Booking..." : "Confirm Booking"}
								</button>
								<button
									style={{
										padding: "10px 24px",
										borderRadius: "8px",
										background: "#aaa",
										color: "#fff",
										border: "none",
										fontWeight: "bold",
										fontSize: "1rem",
										cursor: "pointer",
									}}
									onClick={() => setBookingDialog({ open: false })}
									disabled={isBooking}
								>
									Cancel
								</button>
							</Stack>
						</CardContent>
					</Card>
				)}
			</Stack>
		);
	}

	if (role === "OWNER") {
		return (
			<Stack spacing={3} mt={2}>
				<Card elevation={3} sx={{ backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
					<CardContent>
						<Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", color: "#333" }}>
							Welcome, {JSON.parse(localStorage.getItem("user") || "{}").fullName || "Owner"}!
						</Typography>
						<Typography variant="body1" sx={{ color: "#555" }}>
							You have <b>{ownerBookingCount}</b> bookings.
						</Typography>
						<Typography variant="h6" sx={{ mt: 2 }}>
							Your Venues:
						</Typography>
						<List>
							{ownerVenues.map((venue) => (
								<ListItem key={venue.id}>
									<ListItemText
										primary={venue.name}
										secondary={`City: ${venue.city}, Starting Price: ₹${venue.startingPricePerHour}/hr`}
									/>
								</ListItem>
							))}
							{ownerVenues.length === 0 && (
								<ListItem>
									<ListItemText primary="No venues found." />
								</ListItem>
							)}
						</List>
					</CardContent>
				</Card>
			</Stack>
		);
	}

	return <Box>{/* Admin view content here */}</Box>;
}
