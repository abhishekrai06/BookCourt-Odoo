"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";

interface ConfirmationDialogOptions {
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
}

interface ConfirmationDialogContextType {
	showConfirmationDialog: (options: ConfirmationDialogOptions) => void;
	hideConfirmationDialog: () => void;
	options: ConfirmationDialogOptions | null;
}

const ConfirmationDialogContext = createContext<ConfirmationDialogContextType | undefined>(undefined);

export const useConfirmationDialog = (): ConfirmationDialogContextType => {
	const context = useContext(ConfirmationDialogContext);
	if (!context) {
		throw new Error("useConfirmationDialog must be used within a ConfirmationDialogProvider");
	}
	return context;
};

interface ConfirmationDialogProviderProps {
	children: ReactNode;
}

export const ConfirmationDialogProvider: React.FC<ConfirmationDialogProviderProps> = ({ children }) => {
	const [options, setOptions] = useState<ConfirmationDialogOptions | null>(null);

	const showConfirmationDialog = (options: ConfirmationDialogOptions) => {
		setOptions(options);
	};
	const hideConfirmationDialog = () => {
		setOptions(null);
	};

	return (
		<ConfirmationDialogContext.Provider value={{ showConfirmationDialog, hideConfirmationDialog, options }}>
			{children}
		</ConfirmationDialogContext.Provider>
	);
};
