import * as React from "react";
import type { Viewport } from "next";

import "@/styles/global.css";

import { ConfirmationDialogProvider } from "@/contexts/confirmation";
import { ProgressProvider } from "@/contexts/progress-context";
import { ToastProvider } from "@/contexts/toast-context";
import { UserProvider } from "@/contexts/user-context";
import GlobalConfirmationDialog from "@/components/core/global-confirmation-dialog";
import { LocalizationProvider } from "@/components/core/localization-provider";
import { ThemeProvider } from "@/components/core/theme-provider/theme-provider";

export const viewport = { width: "device-width", initialScale: 1 } satisfies Viewport;

interface LayoutProps {
	children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
	return (
		<html lang="en">
			<body>
				<LocalizationProvider>
					<UserProvider>
						<ConfirmationDialogProvider>
							<ProgressProvider>
								<GlobalConfirmationDialog />
								<ToastProvider>
									<ThemeProvider>{children}</ThemeProvider>
								</ToastProvider>
							</ProgressProvider>
						</ConfirmationDialogProvider>
					</UserProvider>
				</LocalizationProvider>
			</body>
		</html>
	);
}
