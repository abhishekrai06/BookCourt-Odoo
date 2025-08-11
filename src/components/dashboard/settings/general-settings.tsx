"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ReorderIcon from "@mui/icons-material/Reorder";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import { Box } from "@mui/system";

import { paths } from "@/paths";
import { useToast } from "@/contexts/toast-context";

export function Notifications(): React.JSX.Element {
	const { showToast } = useToast();

	const isAdminUser = (): boolean => {
		if (typeof window !== "undefined") {
			const storedUser = localStorage.getItem("user");
			if (storedUser) {
				const user = JSON.parse(storedUser);
				return user.account_type === "ADMIN";
			}
		}
		return false;
	};

	const handleOpenUsers = () => {
		if (!isAdminUser()) {
			showToast("Access denied: You do not have permission to access this feature.", "error");
			return;
		}
		window.location.href = paths.dashboard.users;
	};

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
			}}
		>
			<Card>
				<CardHeader title="General" />
				<Divider />
				<CardContent>
					{/* Responsive 2-column layout without MUI Grid */}
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
							gap: 2,
						}}
					>
						<Box>
							<Button variant="outlined" fullWidth startIcon={<GroupIcon />} onClick={handleOpenUsers}>
								Users
							</Button>
						</Box>

						<Box>
							<Link href={paths.dashboard.account}>
								<Button variant="outlined" fullWidth startIcon={<PersonIcon />}>
									Profile
								</Button>
							</Link>
						</Box>
					</Box>
				</CardContent>
			</Card>
		</form>
	);
}
