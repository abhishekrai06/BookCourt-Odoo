"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { z as zod } from "zod";

import { SignUpRequestData } from "@/types/api-requests";
import { paths } from "@/paths";
import { authClient } from "@/lib/auth/client";
import { useProgress } from "@/contexts/progress-context";
import { useToast } from "@/contexts/toast-context";
import { useUser } from "@/hooks/use-user";

const ROLE_OPTIONS = [
	{ value: "USER", label: "User" },
	{ value: "OWNER", label: "Owner" },
	{ value: "ADMIN", label: "Admin" },
];

const schema = zod
	.object({
		fullName: zod.string().min(1, { message: "Full name is required" }),
		email: zod
			.string()
			.min(1, { message: "Email is required" })
			.email({ message: "Please enter a valid email address" }),
		password: zod.string().min(6, { message: "Password should be at least 6 characters" }),
		confirmPassword: zod.string().min(1, { message: "Please confirm your password" }),
		role: zod.enum(["USER", "OWNER", "ADMIN"], { message: "Role is required" }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type Values = zod.infer<typeof schema>;

const defaultValues = {
	fullName: "",
	email: "",
	password: "",
	confirmPassword: "",
	role: "USER",
} satisfies Values;

export function SignUpForm(): React.JSX.Element {
	const router = useRouter();

	const { checkSession } = useUser();
	const { showToast } = useToast();
	const { startLoading, stopLoading } = useProgress();

	const [isPending, setIsPending] = React.useState<boolean>(false);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

	const onSubmit = React.useCallback(
		async (values: Values): Promise<void> => {
			setIsPending(true);
			startLoading(); // Start loading indicator

			const requestData: SignUpRequestData = {
				fullName: values.fullName,
				email: values.email,
				password: values.password,
				role: values.role,
			};
			const { error } = await authClient.signUp(requestData);

			if (error) {
				setError("root", { type: "server", message: error });
				setIsPending(false);
				stopLoading(); // Stop loading indicator on error
				return;
			}
			router.replace(paths.auth.signIn);
			setIsPending(false);
			stopLoading(); // Stop loading indicator on success
			showToast("Account created successfully.", "success");
		},
		[checkSession, router, setError, startLoading, stopLoading]
	);

	return (
		<Stack spacing={3}>
			<Stack spacing={1}>
				<Typography variant="h4">Sign up</Typography>
				<Typography color="text.secondary" variant="body2">
					Already have an account?{" "}
					<Link component={RouterLink} href={paths.auth.signIn} underline="hover" variant="subtitle2">
						Sign in
					</Link>
				</Typography>
			</Stack>
			<form onSubmit={handleSubmit(onSubmit)}>
				<Stack spacing={2}>
					<Controller
						control={control}
						name="fullName"
						render={({ field }) => (
							<FormControl error={Boolean(errors.fullName)}>
								<InputLabel>Full name</InputLabel>
								<OutlinedInput {...field} label="Full name" />
								{errors.fullName ? <FormHelperText>{errors.fullName.message}</FormHelperText> : null}
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="email"
						render={({ field }) => (
							<FormControl error={Boolean(errors.email)}>
								<InputLabel>Email address</InputLabel>
								<OutlinedInput {...field} label="Email address" type="email" />
								{errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="password"
						render={({ field }) => (
							<FormControl error={Boolean(errors.password)}>
								<InputLabel>Password</InputLabel>
								<OutlinedInput {...field} label="Password" type="password" />
								{errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
							</FormControl>
						)}
					/>

					<Controller
						control={control}
						name="confirmPassword"
						render={({ field }) => (
							<FormControl error={Boolean(errors.confirmPassword)}>
								<InputLabel>Confirm Password</InputLabel>
								<OutlinedInput {...field} label="Confirm Password" type="password" />
								{errors.confirmPassword ? <FormHelperText>{errors.confirmPassword.message}</FormHelperText> : null}
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="role"
						render={({ field }) => (
							<FormControl error={Boolean(errors.role)} fullWidth>
								<select
									{...field}
									id="role"
									style={{ height: 56, borderRadius: 4, border: "1px solid #ccc", padding: "0 14px", width: "100%" }}
								>
									{ROLE_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								{errors.role ? <FormHelperText>{errors.role.message}</FormHelperText> : null}
							</FormControl>
						)}
					/>

					{errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
					<Button disabled={isPending} type="submit" variant="contained">
						Sign up
					</Button>
				</Stack>
			</form>
		</Stack>
	);
}
