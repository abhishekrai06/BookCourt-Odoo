import * as React from "react";
import type { Metadata } from "next";
import Stack from "@mui/material/Stack";

import { config } from "@/config";
import { VenuesTable } from "@/components/dashboard/venues/venue-table";

export const metadata = { title: `Visitors | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
	return (
		<Stack>
			<VenuesTable />
		</Stack>
	);
}
