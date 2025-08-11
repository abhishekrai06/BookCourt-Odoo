"use client";

import * as React from "react";
import { ApiNames, ServerCodes } from "@/app/constants/constants";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Button, CardContent, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

import { deleteData, getData, putData } from "@/lib/connection";
import { useConfirmationDialog } from "@/contexts/confirmation";
import { useToast } from "@/contexts/toast-context";

const styles = {
	table: {
		tableLayout: "auto" as const,
		width: "100%",
	},
	cell: {
		minWidth: "100px",
		maxWidth: "300px",
		overflow: "hidden" as const,
		textOverflow: "ellipsis" as const,
		whiteSpace: "nowrap" as const,
	},
};

export function BookingsTable(): React.JSX.Element {
	const [data, setData] = React.useState<any[]>([]);
	const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
	const [page, setPage] = React.useState(1);
	const [rowsPerPage, setRowsPerPage] = React.useState(5);
	const [searchTerm, setSearchTerm] = React.useState("");
	const [totalRows, setTotalRows] = React.useState(0);
	const { showToast } = useToast();
	const { showConfirmationDialog } = useConfirmationDialog();
	const [role, setRole] = React.useState<string | null | undefined>();
	const [userId, setUserId] = React.useState<string | null>(null);
	const [actionLoading, setActionLoading] = React.useState<string | null>(null);

	React.useEffect(() => {
		try {
			const stored = localStorage.getItem("user");
			if (stored) {
				const parsed = JSON.parse(stored);
				setRole(parsed.role ?? null);
				setUserId(parsed.id ?? null);
			} else {
				setRole(null);
				setUserId(null);
			}
		} catch {
			setRole(null);
			setUserId(null);
		}
	}, []);

	const handlePageChange = (_: unknown, newPage: number) => {
		setPage(newPage + 1);
	};

	const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(1);
	};

	const fetchData = async (page: number, rowsPerPage: number, searchTerm: string) => {
		try {
			let params: Record<string, string> = {
				page: page.toString(),
				pageSize: rowsPerPage.toString(),
			};
			if (searchTerm) {
				params.query = searchTerm;
			}
			if (role === "USER" && userId) {
				params.userId = userId;
			}
			// For OWNER, fetch bookings for their venue courts
			if (role === "OWNER" && userId) {
				params.ownerId = userId;
			}
			const response = await getData(ApiNames.Booking, params);
			if (response.code === ServerCodes.Success && Array.isArray(response.data)) {
				setData(response.data);
				setTotalRows(response.totalRecords ?? 0);
			} else {
				setData([]);
				setTotalRows(0);
			}
		} catch (error) {
			setData([]);
			setTotalRows(0);
		}
	};

	React.useEffect(() => {
		if (role) {
			fetchData(page, rowsPerPage, searchTerm);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [role, page, rowsPerPage, searchTerm, userId]);

	const handleSearch = (value: string) => {
		setSearchTerm(value);
		setPage(1);
	};

	const handleCancelBooking = async (bookingId: string) => {
		setActionLoading(bookingId);
		try {
			const response = await deleteData(ApiNames.Booking, { id: bookingId });
			if (response.code !== ServerCodes.Success) {
				showToast(response.message || "Unknown Error", "error");
				setActionLoading(null);
				return;
			}
			fetchData(page, rowsPerPage, searchTerm);
			showToast("Booking cancelled successfully", "success");
		} catch (err) {
			showToast(err instanceof Error ? err.message : "An unknown error occurred", "error");
		}
		setActionLoading(null);
	};

	const onCancelClicked = (bookingId: string) => {
		showConfirmationDialog({
			message: "Are you sure you want to cancel this booking?",
			onConfirm: () => handleCancelBooking(bookingId),
			onCancel() {},
		});
	};

	const handleConfirmBooking = async (booking: any) => {
		setActionLoading(booking.id);
		try {
			const result = await putData(ApiNames.Booking, {
				id: booking.id,
				userId: booking.userId,
				courtId: booking.courtId,
				startsAt: booking.startsAt,
				endsAt: booking.endsAt,
				totalPrice: booking.totalPrice,
				status: "CONFIRMED",
			});
			if (result.code !== ServerCodes.Success) {
				showToast(result.message || "Unknown Error", "error");
				setActionLoading(null);
				return;
			}
			fetchData(page, rowsPerPage, searchTerm);
			showToast("Booking confirmed successfully", "success");
		} catch (err) {
			showToast(err instanceof Error ? err.message : "An unknown error occurred", "error");
		}
		setActionLoading(null);
	};

	return (
		<>
			<Stack spacing={3}>
				<Stack direction="row">
					<Stack spacing={1} sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Bookings</Typography>
					</Stack>
					{/* BookingFilters can be added here if available */}
				</Stack>

				<Card>
					<Box sx={{ overflowX: "auto" }}>
						<Table style={styles.table} sx={{ minWidth: "800px" }}>
							<TableHead>
								<TableRow>
									<TableCell />
									<TableCell style={styles.cell}>Court Name</TableCell>
									<TableCell style={styles.cell}>Venue</TableCell>
									<TableCell style={styles.cell}>Sport</TableCell>
									<TableCell style={styles.cell}>Start Time</TableCell>
									<TableCell style={styles.cell}>End Time</TableCell>
									<TableCell style={styles.cell}>Total Price</TableCell>
									<TableCell style={styles.cell}>Status</TableCell>
									<TableCell style={styles.cell}>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{data.map((booking) => {
									const court = booking.court || {};
									const venueName = court.facility?.name || "-";
									return (
										<React.Fragment key={booking.id}>
											<TableRow hover>
												<TableCell>{/* Expand for more details if needed */}</TableCell>
												<TableCell style={styles.cell}>{court.name}</TableCell>
												<TableCell style={styles.cell}>{venueName}</TableCell>
												<TableCell style={styles.cell}>{court.sport}</TableCell>
												<TableCell style={styles.cell}>{new Date(booking.startsAt).toLocaleString()}</TableCell>
												<TableCell style={styles.cell}>{new Date(booking.endsAt).toLocaleString()}</TableCell>
												<TableCell style={styles.cell}>{booking.totalPrice}</TableCell>
												<TableCell style={styles.cell}>{booking.status}</TableCell>
												<TableCell style={styles.cell}>
													{role === "USER" && (
														<IconButton
															color="error"
															onClick={() => onCancelClicked(booking.id)}
															disabled={actionLoading === booking.id}
														>
															<DeleteIcon />
														</IconButton>
													)}
													{role === "OWNER" && (
														<>
															<IconButton
																color="success"
																onClick={() => handleConfirmBooking(booking)}
																disabled={actionLoading === booking.id || booking.status === "CONFIRMED"}
															>
																{/* Correct icon for confirm (check) */}
																<span style={{ color: "green", fontSize: 20, fontWeight: "bold" }}>&#10003;</span>
															</IconButton>
															<IconButton
																color="error"
																onClick={() => onCancelClicked(booking.id)}
																disabled={actionLoading === booking.id}
															>
																<DeleteIcon />
															</IconButton>
														</>
													)}
												</TableCell>
											</TableRow>
										</React.Fragment>
									);
								})}
							</TableBody>
						</Table>
					</Box>

					<Divider />
					<TablePagination
						component="div"
						count={totalRows}
						page={page - 1}
						onPageChange={handlePageChange}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={handleRowsPerPageChange}
						rowsPerPageOptions={[5, 10, 25]}
					/>
				</Card>
			</Stack>
		</>
	);
}

export default BookingsTable;
