"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";

interface ProgressContextType {
	loading: boolean;
	startLoading: () => void;
	stopLoading: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = (): ProgressContextType => {
	const context = useContext(ProgressContext);
	if (!context) {
		throw new Error("useProgress must be used within a ProgressProvider");
	}
	return context;
};

interface ProgressProviderProps {
	children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
	const [loading, setLoading] = useState(false);

	const startLoading = () => {
		setLoading(true);
	};
	const stopLoading = () => {
		setLoading(false);
	};

	return <ProgressContext.Provider value={{ loading, startLoading, stopLoading }}>{children}</ProgressContext.Provider>;
};
