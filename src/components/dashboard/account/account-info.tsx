"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { User } from "@/types/user";

export function AccountInfo(): React.JSX.Element {
	const [user, setUser] = React.useState<User | null>(null);
	React.useEffect(() => {
		if (typeof window !== "undefined") {
			const storedUser = localStorage.getItem("user");
			if (storedUser) {
				setUser(JSON.parse(storedUser));
			}
		}
	}, []);
	return (
		<Card>
			<CardContent>
				<Stack spacing={2} sx={{ alignItems: "center" }}>
					<Stack spacing={1} sx={{ textAlign: "center" }}>
						<Typography variant="h5">{user?.fullName}</Typography>
						<Typography color="text.secondary" variant="body2">
							{user?.email}
						</Typography>
					</Stack>
				</Stack>
			</CardContent>
			<Divider />
			<CardActions></CardActions>
		</Card>
	);
}
