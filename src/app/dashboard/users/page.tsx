import * as React from "react";
import type { Metadata } from "next";
import Stack from "@mui/material/Stack";

import { config } from "@/config";
import { UsersTable } from "@/components/dashboard/users/users-table";

export const metadata = { title: `Users | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
	return (
		<Stack>
			<UsersTable />
		</Stack>
	);
}
