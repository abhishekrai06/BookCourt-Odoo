"use client";

import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { useConfirmationDialog } from "@/contexts/confirmation";

const GlobalConfirmationDialog: React.FC = () => {
	const { options, hideConfirmationDialog } = useConfirmationDialog();

	const handleConfirm = () => {
		if (options?.onConfirm) {
			options.onConfirm();
		}
		hideConfirmationDialog();
	};

	const handleCancel = () => {
		if (options?.onCancel) {
			options.onCancel();
		}
		hideConfirmationDialog();
	};

	return (
		<Dialog open={options !== null} onClose={handleCancel}>
			<DialogTitle>Confirmation</DialogTitle>
			<DialogContent>
				<DialogContentText>{options?.message}</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleCancel} color="primary">
					Cancel
				</Button>
				<Button onClick={handleConfirm} color="warning" autoFocus variant="contained">
					Confirm
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default GlobalConfirmationDialog;
