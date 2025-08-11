"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";

import { User } from "@/types/user";

export function AccountDetailsForm(): React.JSX.Element {
	const [user, setUser] = React.useState<User | null>(null);

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			const storedUser = localStorage.getItem("user");
			if (storedUser) setUser(JSON.parse(storedUser));
		}
	}, []);

	return (
		<Card>
			<CardHeader subheader="The information cannot be edited" title="Profile" />
			<Divider />
			<CardContent>
				<Stack spacing={3}>
					<FormControl fullWidth disabled>
						<InputLabel htmlFor="full-name">Full name</InputLabel>
						<OutlinedInput id="full-name" label="Full name" name="fullName" value={user?.fullName ?? ""} />
					</FormControl>

					<FormControl fullWidth disabled>
						<InputLabel htmlFor="email">Email address</InputLabel>
						<OutlinedInput id="email" label="Email address" name="email" value={user?.email ?? ""} />
					</FormControl>

					<FormControl fullWidth disabled>
						<InputLabel htmlFor="role">Role</InputLabel>
						<OutlinedInput id="role" label="Role" value={user?.role ?? ""} />
					</FormControl>
				</Stack>
			</CardContent>
			<Divider />
		</Card>
	);
}
