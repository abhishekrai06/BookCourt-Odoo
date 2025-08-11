"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import MuiAlert, { type AlertProps } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

interface ToastContextType {
	showToast: (message: string, severity?: AlertProps["severity"]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
	return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export function ToastProvider({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [severity, setSeverity] = useState<AlertProps["severity"]>("info");

	const showToast = (message: string, severity: AlertProps["severity"] = "info") => {
		setMessage(message);
		setSeverity(severity);
		setOpen(true);
	};

	const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
		if (reason === "clickaway") {
			return;
		}
		setOpen(false);
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
				<Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
					{message}
				</Alert>
			</Snackbar>
		</ToastContext.Provider>
	);
}

export const useToast = (): ToastContextType => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
};
