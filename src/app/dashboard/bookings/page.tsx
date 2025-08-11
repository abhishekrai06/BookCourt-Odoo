import * as React from "react";
import type { Metadata } from "next";
import Stack from "@mui/material/Stack";

import { config } from "@/config";
import BookingsTable from "@/components/dashboard/bookings/bookings-table";

export const metadata = { title: `My Bookings | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
	return (
		<Stack>
			<BookingsTable />
		</Stack>
	);
}
