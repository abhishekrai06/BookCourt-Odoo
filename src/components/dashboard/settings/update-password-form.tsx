"use client";

import * as React from "react";
import { ApiNames, ServerCodes } from "@/app/constants/constants";
import LockIcon from "@mui/icons-material/Lock";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Box } from "@mui/system";

import { ResetPasswordPostRequestData } from "@/types/api-requests";
import { ApiResponse } from "@/types/api-response";
import { postData } from "@/lib/connection";
import { useProgress } from "@/contexts/progress-context";
import { useToast } from "@/contexts/toast-context";

export function UpdatePasswordForm(): React.JSX.Element {
	const [open, setOpen] = React.useState(false);
	const [oldPassword, setOldPassword] = React.useState("");
	const [newPassword, setNewPassword] = React.useState("");
	const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const { showToast } = useToast();
	const { startLoading, stopLoading } = useProgress();

	const handleClickOpen = () => setOpen(true);

	const handleClose = () => {
		setOpen(false);
		setError(null);
		setOldPassword("");
		setNewPassword("");
		setConfirmNewPassword("");
	};

	const handleUpdatePassword = async () => {
		startLoading();
		setError(null);

		if (!oldPassword) {
			setError("Old password cannot be empty");
			stopLoading();
			return;
		}

		if (newPassword !== confirmNewPassword) {
			setError("New passwords do not match");
			stopLoading();
			return;
		}

		const requestData: ResetPasswordPostRequestData = {
			old_password: oldPassword,
			new_password: newPassword,
		};

		try {
			const response: ApiResponse = await postData(ApiNames.ResetPassword, requestData, {});
			if (response.code === ServerCodes.Success) {
				handleClose();
				showToast("Password has been updated successfully", "success");
			} else {
				setError(`${response.message}`);
			}
		} catch (error) {
			console.error("Error updating password:", error);
			setError("An error occurred while updating the password");
		} finally {
			stopLoading();
		}
	};

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
			}}
		>
			<Stack spacing={3}>
				<Card>
					<CardHeader title="Password" />
					<Divider />
					<CardContent>
						<Box sx={{ width: "100%" }}>
							<Button variant="outlined" fullWidth startIcon={<LockIcon />} onClick={handleClickOpen}>
								Update Password
							</Button>
						</Box>
					</CardContent>
					<Divider />
					<CardActions sx={{ justifyContent: "flex-end" }} />
				</Card>
			</Stack>

			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				PaperProps={{
					style: { overflow: "visible" },
				}}
			>
				<DialogTitle>Update Password</DialogTitle>
				<DialogContent sx={{ overflow: "visible" }}>
					<Stack spacing={2} sx={{ width: "100%" }}>
						<TextField
							autoFocus
							margin="dense"
							label="Old Password"
							type="password"
							fullWidth
							variant="outlined"
							value={oldPassword}
							onChange={(e) => setOldPassword(e.target.value)}
						/>
						<TextField
							margin="dense"
							label="New Password"
							type="password"
							fullWidth
							variant="outlined"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
						<TextField
							margin="dense"
							label="Confirm New Password"
							type="password"
							fullWidth
							variant="outlined"
							value={confirmNewPassword}
							onChange={(e) => setConfirmNewPassword(e.target.value)}
						/>
						{error && <Box sx={{ color: "red" }}>{error}</Box>}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleUpdatePassword} variant="contained">
						Update
					</Button>
				</DialogActions>
			</Dialog>
		</form>
	);
}
