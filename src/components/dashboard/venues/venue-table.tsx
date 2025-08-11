"use client";

import * as React from "react";
import { ApiNames, ServerCodes } from "@/app/constants/constants";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Button, CardContent, Dialog, DialogContent, IconButton, TextField, Typography } from "@mui/material";
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
import { Download as DownloadIcon } from "@phosphor-icons/react/dist/ssr/Download";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { VenueDeleteRequestData } from "@/types/api-requests";
import { ApiResponse } from "@/types/api-response";
import { Venue } from "@/types/venue";
import { deleteData, getData } from "@/lib/connection";
import { useConfirmationDialog } from "@/contexts/confirmation";
import { useToast } from "@/contexts/toast-context";

import AddVenueDialogBox from "./add-venue-dialogbox";
import VenueFilters from "./venue-filter";

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

export function VenuesTable(): React.JSX.Element {
	const [open, setOpen] = React.useState(false);
	const [venueToEdit, setVenueToEdit] = React.useState<Venue | undefined>();
	const [data, setData] = React.useState<Venue[]>([]);
	const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
	const [page, setPage] = React.useState(1);
	const [rowsPerPage, setRowsPerPage] = React.useState(5);
	const [searchTerm, setSearchTerm] = React.useState("");
	const [totalRows, setTotalRows] = React.useState(0);
	const { showToast } = useToast();
	const { showConfirmationDialog } = useConfirmationDialog();

	const handlePageChange = (_: unknown, newPage: number) => {
		setPage(newPage + 1);
	};

	const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(1);
	};

	const handleClickOpen = () => {
		setVenueToEdit(undefined);
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const onEditClicked = async (venue: Venue) => {
		try {
			const response: ApiResponse = await getData(ApiNames.Venue, { id: venue.id });
			if (response.code !== ServerCodes.Success) {
				showToast(response.message || "Failed to fetch venue details", "error");
				return;
			}
			const fullVenue = response.data ? (response.data[0] as Venue) : undefined;
			console.log(fullVenue);
			setVenueToEdit(fullVenue);
			setOpen(true);
		} catch (error) {
			showToast(error instanceof Error ? error.message : "An unknown error occurred", "error");
		}
	};

	const handleDeleteVenue = async (venueId: string) => {
		try {
			const requestData: VenueDeleteRequestData = { id: venueId };
			const response: ApiResponse = await deleteData(ApiNames.Venue, requestData);
			if (response.code !== ServerCodes.Success) {
				showToast(response.message || "Unknown Error", "error");
				return;
			}
			fetchData(page, rowsPerPage, searchTerm);
			showToast("Venue deleted successfully", "success");
		} catch (err) {
			showToast(err instanceof Error ? err.message : "An unknown error occurred", "error");
		}
	};

	const onDeleteClicked = (venueId: string) => {
		showConfirmationDialog({
			message: "Are you sure you want to delete this venue?",
			onConfirm: () => handleDeleteVenue(venueId),
			onCancel() {},
		});
	};

	const handleAddVenue = () => {
		fetchData(page, rowsPerPage, searchTerm);
	};

	const fetchData = async (page: number, rowsPerPage: number, searchTerm: string) => {
		try {
			const response: ApiResponse = await getData(ApiNames.Venue, {
				page: page.toString(),
				pageSize: rowsPerPage.toString(),
				query: searchTerm,
			});
			if (response.code !== ServerCodes.Success) {
				showToast(response.message || "Failed to fetch venues", "error");
			}
			const venues: Venue[] = (response.data ?? []) as Venue[];
			setData(venues);
			setTotalRows(response.totalRecords ?? 0);
		} catch (error) {
			showToast(error instanceof Error ? error.message : "An unknown error occurred", "error");
		}
	};

	React.useEffect(() => {
		fetchData(page, rowsPerPage, searchTerm);
	}, [page, rowsPerPage, searchTerm]);

	const handleSearch = (value: string) => {
		setSearchTerm(value);
		setPage(1);
	};

	// Simple stub so the Export button compiles (replace with real export later)
	const handleExportToExcel = () => {
		showToast("Export coming soon", "info");
	};

	return (
		<>
			<Stack spacing={3}>
				<Stack direction="row">
					<Stack spacing={1} sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Venues</Typography>
					</Stack>
					<Stack direction="row" spacing={3}>
						<VenueFilters onSearch={handleSearch} />
						<Button
							color="inherit"
							startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}
							onClick={handleExportToExcel}
						>
							Export
						</Button>
						<Button
							color="primary"
							startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
							variant="text"
							onClick={handleClickOpen}
						>
							Add
						</Button>
						{open ? (
							<AddVenueDialogBox open={open} onClose={handleClose} venue={venueToEdit} onAddVenue={handleAddVenue} />
						) : null}
					</Stack>
				</Stack>

				<Card>
					<Box sx={{ overflowX: "auto" }}>
						<Table style={styles.table} sx={{ minWidth: "800px" }}>
							<TableHead>
								<TableRow>
									<TableCell />
									<TableCell style={styles.cell}>Venue Name</TableCell>
									<TableCell style={styles.cell}>Address</TableCell>
									<TableCell style={styles.cell}>City</TableCell>
									<TableCell style={styles.cell}>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{data.map((venue) => {
									const hasCourts = Array.isArray(venue.courts) && venue.courts.length > 0;
									return (
										<React.Fragment key={venue.id}>
											<TableRow hover>
												<TableCell>
													{hasCourts ? (
														<IconButton
															size="small"
															onClick={() => setExpandedRow(expandedRow === venue.id ? null : venue.id)}
														>
															{expandedRow === venue.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
														</IconButton>
													) : null}
												</TableCell>
												<TableCell style={styles.cell}>{venue.name}</TableCell>
												<TableCell style={styles.cell}>{venue.address}</TableCell>
												<TableCell style={styles.cell}>{venue.city}</TableCell>
												<TableCell style={styles.cell}>
													<IconButton color="primary" onClick={() => onEditClicked(venue)}>
														<EditIcon />
													</IconButton>
													<IconButton color="error" onClick={() => onDeleteClicked(venue.id)}>
														<DeleteIcon />
													</IconButton>
												</TableCell>
											</TableRow>

											{hasCourts ? (
												<TableRow>
													<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
														<Collapse in={expandedRow === venue.id} timeout="auto" unmountOnExit>
															<Box margin={1}>
																<Typography variant="subtitle1" gutterBottom>
																	Courts
																</Typography>
																<Table size="small">
																	<TableHead>
																		<TableRow>
																			<TableCell>Court Name</TableCell>
																			<TableCell>Sport</TableCell>
																			<TableCell>Price Per Hour</TableCell>
																		</TableRow>
																	</TableHead>
																	<TableBody>
																		{venue.courts!.map((court) => (
																			<TableRow key={court.id}>
																				<TableCell>{court.name}</TableCell>
																				<TableCell>{court.sport}</TableCell>
																				<TableCell>{court.pricePerHour}</TableCell>
																			</TableRow>
																		))}
																	</TableBody>
																</Table>
															</Box>
														</Collapse>
													</TableCell>
												</TableRow>
											) : null}
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
