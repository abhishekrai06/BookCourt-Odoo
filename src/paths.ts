export const paths = {
	home: "/",
	auth: { signIn: "/auth/sign-in", signUp: "/auth/sign-up", resetPassword: "/auth/reset-password" },
	dashboard: {
		overview: "/dashboard",
		account: "/dashboard/account",
		customers: "/dashboard/customers",
		venues: "/dashboard/venues",
		users: "/dashboard/users",
		integrations: "/dashboard/integrations",
		bookings: "/dashboard/bookings",
		settings: "/dashboard/settings",
	},
	errors: { notFound: "/errors/not-found" },
} as const;
