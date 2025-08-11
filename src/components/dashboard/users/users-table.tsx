"use client";

import * as React from "react";
import { ApiNames, ServerCodes } from "@/app/constants/constants";
import {
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

import { getData, putData } from "@/lib/connection";
import { useToast } from "@/contexts/toast-context";

interface User {
	id: string;
	fullName: string;
	email: string;
	role: string;
	banned: boolean;
}

export function UsersTable(): React.JSX.Element {
	const [roleFilter, setRoleFilter] = React.useState<string>("OWNER");
	const [users, setUsers] = React.useState<User[]>([]);
	const [loading, setLoading] = React.useState(false);
	const { showToast } = useToast();

	const fetchUsers = async (role: string) => {
		setLoading(true);
		try {
			const response = await getData(ApiNames.User, { role });
			if (response.code === ServerCodes.Success && Array.isArray(response.data)) {
				setUsers(response.data);
			} else {
				setUsers([]);
				showToast(response.message || "Failed to fetch users", "error");
			}
		} catch (err) {
			setUsers([]);
			showToast("Failed to fetch users", "error");
		}
		setLoading(false);
	};

	React.useEffect(() => {
		fetchUsers(roleFilter);
	}, [roleFilter]);

	const handleBanToggle = async (user: User) => {
		try {
			const response = await putData(ApiNames.User, { id: user.id, banned: !user.banned });
			if (response.code === ServerCodes.Success) {
				showToast(response.message || "User updated", "success");
				fetchUsers(roleFilter);
			} else {
				showToast(response.message || "Failed to update user", "error");
			}
		} catch (err) {
			showToast("Failed to update user", "error");
		}
	};

	return (
		<Stack spacing={2}>
			<Stack direction="row" spacing={2} alignItems="center">
				<Typography variant="h5">Users</Typography>
				<FormControl size="small" sx={{ minWidth: 120 }}>
					<InputLabel id="role-filter-label">Role</InputLabel>
					<Select
						labelId="role-filter-label"
						value={roleFilter}
						label="Role"
						onChange={(e) => setRoleFilter(e.target.value)}
					>
						<MenuItem value="OWNER">Owner</MenuItem>
						<MenuItem value="USER">User</MenuItem>
					</Select>
				</FormControl>
			</Stack>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Name</TableCell>
							<TableCell>Email</TableCell>
							<TableCell>Role</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={5} align="center">
									Loading...
								</TableCell>
							</TableRow>
						) : users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} align="center">
									No users found.
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>{user.fullName}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>{user.role}</TableCell>
									<TableCell>
										{user.banned ? (
											<Typography color="error.main">Banned</Typography>
										) : (
											<Typography color="success.main">Active</Typography>
										)}
									</TableCell>
									<TableCell>
										<Button
											variant="contained"
											color={user.banned ? "success" : "error"}
											size="small"
											onClick={() => handleBanToggle(user)}
										>
											{user.banned ? "Unban" : "Ban"}
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
}
