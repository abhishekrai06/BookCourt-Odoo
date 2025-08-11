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
	const [ownerBookings, setOwnerBookings] = React.useState<any[]>([]);

	React.useEffect(() => {
		const fetchOwnerBookings = async () => {
			const user = JSON.parse(localStorage.getItem("user") || "{}");
			if (!user.id) return;
			const response = await getData(ApiNames.Booking, { ownerId: user.id, page: "1", pageSize: "100" });
			if (response.code === ServerCodes.Success && Array.isArray(response.data)) {
				setOwnerBookings(response.data);
			} else {
				setOwnerBookings([]);
			}
		};
		fetchOwnerBookings();
	}, [ownerVenues]);
	const [reviewDialog, setReviewDialog] = React.useState<{ open: boolean; court?: any; venue?: any }>({
		open: false,
	});
	const [reviewForm, setReviewForm] = React.useState({ rating: 5, comment: "" });
	const [isReviewing, setIsReviewing] = React.useState(false);
	const [courtReviews, setCourtReviews] = React.useState<{
		[courtId: string]: { avgRating: number; reviews: any[] };
	}>({});
	const [viewReviewsCourtId, setViewReviewsCourtId] = React.useState<string | null>(null);

	if (role === "USER") {
		const fetchCourtReviews = async (facilityId: string, courtId: string) => {
			const response = await getData("review", { facilityId });
			if (response.code === ServerCodes.Success && Array.isArray(response.data)) {
				const { avgRating, reviews } = response.data[0];
				setCourtReviews((prev) => ({ ...prev, [courtId]: { avgRating, reviews } }));
			}
		};

		const handleOpenReviewDialog = (court: any, venue: any) => {
			setReviewDialog({ open: true, court, venue });
			fetchCourtReviews(venue.id, court.id);
		};

		const handleSubmitReview = async () => {
			setIsReviewing(true);
			try {
				const user = JSON.parse(localStorage.getItem("user") || "{}");
				const payload = {
					userId: user.id,
					facilityId: reviewDialog.venue.id,
					rating: reviewForm.rating,
					comment: reviewForm.comment,
				};
				const response = await postData("review", payload);
				if (response.code === ServerCodes.Success) {
					showToast("Review submitted!", "success");
					setReviewDialog({ open: false });
					fetchCourtReviews(reviewDialog.venue.id, reviewDialog.court.id);
				} else {
					showToast(response.message || "Review failed", "error");
				}
			} catch (err) {
				showToast("Review failed", "error");
			}
			setIsReviewing(false);
		};

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
										const reviewInfo = courtReviews[court.id] || {};
										return (
											<>
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
															<span style={{ color: booking ? "#1976d2" : "#555" }}>
																Price: ₹{court.pricePerHour}/hr
															</span>
														}
													/>
													<Box sx={{ ml: 2, minWidth: 120 }}>
														<Typography variant="body2" sx={{ color: "#ffa726", fontWeight: "bold" }}>
															Avg Rating: {reviewInfo.avgRating ? reviewInfo.avgRating.toFixed(1) : "N/A"}
														</Typography>
														<button
															style={{
																marginTop: 4,
																padding: "4px 12px",
																borderRadius: "6px",
																background: "#1976d2",
																color: "#fff",
																border: "none",
																fontWeight: "bold",
																fontSize: "0.9rem",
																cursor: "pointer",
															}}
															onClick={() => {
																fetchCourtReviews(venue.id, court.id);
																setViewReviewsCourtId(viewReviewsCourtId === court.id ? null : court.id);
															}}
														>
															{viewReviewsCourtId === court.id ? "Hide Reviews" : "View Reviews"}
														</button>
													</Box>
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
															<button
																style={{
																	marginTop: 8,
																	padding: "6px 16px",
																	borderRadius: "8px",
																	background: "#ffa726",
																	color: "#fff",
																	border: "none",
																	fontWeight: "bold",
																	fontSize: "0.95rem",
																	cursor: "pointer",
																}}
																onClick={() => handleOpenReviewDialog(court, venue)}
															>
																{reviewInfo.reviews && reviewInfo.reviews.some((r) => r.userId === booking.userId)
																	? "Edit Review"
																	: "Submit Review"}
															</button>
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
												{viewReviewsCourtId === court.id && reviewInfo.reviews && (
													<Box sx={{ ml: 4, mb: 2, p: 2, background: "#f5f5f5", borderRadius: "8px" }}>
														<Typography variant="subtitle2" sx={{ color: "#1976d2", fontWeight: "bold" }}>
															Reviews:
														</Typography>
														{reviewInfo.reviews.length === 0 ? (
															<Typography variant="body2">No reviews yet.</Typography>
														) : (
															reviewInfo.reviews.map((r: any) => (
																<Box
																	key={r.id}
																	sx={{ mb: 1, p: 1, background: "#fff", borderRadius: "6px", boxShadow: 1 }}
																>
																	<Typography variant="body2" sx={{ fontWeight: "bold", color: "#1976d2" }}>
																		{r.user?.fullName || "User"}
																	</Typography>
																	<Typography variant="body2">Rating: {r.rating}</Typography>
																	<Typography variant="body2">{r.comment}</Typography>
																</Box>
															))
														)}
													</Box>
												)}
											</>
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
				{reviewDialog.open && reviewDialog.court && (
					<Card
						elevation={6}
						sx={{ maxWidth: 400, mx: "auto", mt: 2, borderRadius: "16px", boxShadow: 4, background: "#fff" }}
					>
						<CardContent>
							<Typography variant="h6" gutterBottom sx={{ color: "#1976d2", fontWeight: "bold" }}>
								Review Court: {reviewDialog.court.name} ({reviewDialog.court.sport})
							</Typography>
							<Typography color="text.secondary" gutterBottom>
								Venue: {reviewDialog.venue?.name}
							</Typography>
							<Stack spacing={2}>
								<label style={{ fontWeight: "bold", color: "#1976d2" }}>Rating:</label>
								<input
									type="number"
									min={1}
									max={5}
									value={reviewForm.rating}
									onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
									style={{ padding: "8px", borderRadius: "8px", border: "1px solid #1976d2", fontSize: "1rem" }}
								/>
								<label style={{ fontWeight: "bold", color: "#1976d2" }}>Comment:</label>
								<textarea
									value={reviewForm.comment}
									onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
									rows={3}
									style={{ padding: "8px", borderRadius: "8px", border: "1px solid #1976d2", fontSize: "1rem" }}
								/>
								<button
									style={{
										padding: "10px 24px",
										borderRadius: "8px",
										background: "#1976d2",
										color: "#fff",
										border: "none",
										fontWeight: "bold",
										fontSize: "1rem",
										cursor: "pointer",
										boxShadow: "0 2px 8px rgba(25,118,210,0.15)",
										transition: "background 0.3s",
									}}
									onClick={handleSubmitReview}
									disabled={isReviewing}
								>
									{isReviewing ? "Submitting..." : "Submit Review"}
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
									onClick={() => setReviewDialog({ open: false })}
									disabled={isReviewing}
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
		const getCourtBookingCount = (venue: any, courtId: string) => {
			return ownerBookings.filter((b) => b.courtId === courtId).length;
		};

		return (
			<Stack spacing={3} mt={2}>
				<Card
					elevation={6}
					sx={{
						background: "linear-gradient(90deg,#1976d2 0%,#42a5f5 100%)",
						borderRadius: "16px",
						boxShadow: 4,
						mb: 2,
					}}
				>
					<CardContent>
						<Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#fff" }}>
							Welcome, {JSON.parse(localStorage.getItem("user") || "{}").fullName || "Owner"}!
						</Typography>
						<Typography variant="body1" sx={{ color: "#e3f2fd", fontSize: "1.1rem" }}>
							You have <b>{ownerBookings.length}</b> total bookings across your venues.
						</Typography>
						<Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
							<button
								style={{
									padding: "16px 32px",
									borderRadius: "12px",
									background: "linear-gradient(90deg,#42a5f5 0%,#1976d2 100%)",
									color: "#fff",
									border: "none",
									fontWeight: "bold",
									fontSize: "1.2rem",
									cursor: "pointer",
									boxShadow: "0 2px 8px rgba(25,118,210,0.15)",
									transition: "background 0.3s",
								}}
								onClick={() => (window.location.href = "/dashboard/venues")}
							>
								Go to My Venues
							</button>
							<button
								style={{
									padding: "16px 32px",
									borderRadius: "12px",
									background: "#fff",
									color: "#1976d2",
									border: "2px solid #1976d2",
									fontWeight: "bold",
									fontSize: "1.2rem",
									cursor: "pointer",
									boxShadow: "0 2px 8px rgba(25,118,210,0.10)",
									transition: "background 0.3s",
								}}
								onClick={() => (window.location.href = "/dashboard/profile")}
							>
								Go to Profile
							</button>
						</Stack>
					</CardContent>
				</Card>
				<Card elevation={3} sx={{ backgroundColor: "#f5f5f5", borderRadius: "12px" }}>
					<CardContent>
						<Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
							Your Venues
						</Typography>
						<List>
							{ownerVenues.map((venue) => (
								<ListItem key={venue.id} sx={{ flexDirection: "column", alignItems: "flex-start", mb: 2 }}>
									<ListItemText
										primary={<span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{venue.name}</span>}
										secondary={
											<span style={{ color: "#555" }}>
												City: {venue.city}, Starting Price: ₹{venue.startingPricePerHour}/hr
											</span>
										}
									/>
									<Typography variant="subtitle2" sx={{ mt: 1, color: "#1976d2", fontWeight: "bold" }}>
										Courts:
									</Typography>
									<List sx={{ width: "100%" }}>
										{(venue.courts || []).map((court: any) => (
											<ListItem
												key={court.id}
												sx={{
													display: "flex",
													alignItems: "center",
													background: "#e3f2fd",
													borderRadius: "8px",
													mb: 1,
												}}
											>
												<ListItemText
													primary={
														<span style={{ fontWeight: "bold", color: "#1976d2" }}>
															{court.name} ({court.sport})
														</span>
													}
													secondary={<span style={{ color: "#555" }}>Price: ₹{court.pricePerHour}/hr</span>}
												/>
												<Box sx={{ ml: 2, p: 2, background: "#bbdefb", borderRadius: "8px", minWidth: 180 }}>
													<Typography variant="body2" sx={{ color: "#1976d2", fontWeight: "bold" }}>
														Bookings: {getCourtBookingCount(venue, court.id)}
													</Typography>
												</Box>
											</ListItem>
										))}
										{(venue.courts || []).length === 0 && (
											<ListItem>
												<ListItemText primary="No courts available." />
											</ListItem>
										)}
									</List>
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

	// Admin view
	return (
		<Stack spacing={3} mt={2}>
			<Card
				elevation={3}
				sx={{ background: "linear-gradient(90deg,#1976d2 0%,#42a5f5 100%)", borderRadius: "16px", boxShadow: 3 }}
			>
				<CardContent>
					<Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#fff" }}>
						Welcome, {JSON.parse(localStorage.getItem("user") || "{}").fullName || "Admin"}!
					</Typography>
					<Typography variant="body1" sx={{ color: "#e3f2fd" }}>
						You can manage all users and venues below.
					</Typography>
				</CardContent>
			</Card>
			<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
				<Card elevation={2} sx={{ flex: 1, borderRadius: "12px", background: "#fff", boxShadow: 2 }}>
					<CardContent>
						<Typography variant="h6" sx={{ color: "#1976d2", fontWeight: "bold" }}>
							Total Owners
						</Typography>
						<Typography variant="h4" sx={{ color: "#1976d2", fontWeight: "bold" }}>
							{dashboardStats.totalOwners}
						</Typography>
					</CardContent>
				</Card>
				<Card elevation={2} sx={{ flex: 1, borderRadius: "12px", background: "#fff", boxShadow: 2 }}>
					<CardContent>
						<Typography variant="h6" sx={{ color: "#1976d2", fontWeight: "bold" }}>
							Total Users
						</Typography>
						<Typography variant="h4" sx={{ color: "#1976d2", fontWeight: "bold" }}>
							{dashboardStats.totalUsers}
						</Typography>
					</CardContent>
				</Card>
				<Card elevation={2} sx={{ flex: 1, borderRadius: "12px", background: "#fff", boxShadow: 2 }}>
					<CardContent>
						<Typography variant="h6" sx={{ color: "#1976d2", fontWeight: "bold" }}>
							Total Venues
						</Typography>
						<Typography variant="h4" sx={{ color: "#1976d2", fontWeight: "bold" }}>
							{dashboardStats.totalVenues}
						</Typography>
					</CardContent>
				</Card>
			</Stack>
			<Card elevation={3} sx={{ backgroundColor: "#f5f5f5", borderRadius: "12px" }}>
				<CardContent>
					<Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
						Accessibility Options
					</Typography>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
						<button
							style={{
								padding: "16px 32px",
								borderRadius: "12px",
								background: "linear-gradient(90deg,#42a5f5 0%,#1976d2 100%)",
								color: "#fff",
								border: "none",
								fontWeight: "bold",
								fontSize: "1.2rem",
								cursor: "pointer",
								boxShadow: "0 2px 8px rgba(25,118,210,0.15)",
								transition: "background 0.3s",
							}}
							onClick={() => (window.location.href = "/dashboard/users")}
						>
							Manage Users
						</button>
						<button
							style={{
								padding: "16px 32px",
								borderRadius: "12px",
								background: "linear-gradient(90deg,#1976d2 0%,#42a5f5 100%)",
								color: "#fff",
								border: "none",
								fontWeight: "bold",
								fontSize: "1.2rem",
								cursor: "pointer",
								boxShadow: "0 2px 8px rgba(25,118,210,0.15)",
								transition: "background 0.3s",
							}}
							onClick={() => (window.location.href = "/dashboard/customers")}
						>
							Manage Venues
						</button>
					</Stack>
				</CardContent>
			</Card>
		</Stack>
	);
}
