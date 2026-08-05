import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { signUp } from "#/lib/auth-client.ts";

export function SignUpCard(props: React.ComponentProps<typeof Card>) {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		const form = new FormData(event.currentTarget);
		const password = String(form.get("password"));
		if (password !== String(form.get("confirmPassword"))) {
			setError("Passwords do not match.");
			return;
		}

		setIsSubmitting(true);
		const result = await signUp.email({
			name: String(form.get("name")),
			email: String(form.get("email")),
			password,
		});

		if (result.error) {
			setError(
				result.error.message ?? "We couldn't create your account. Try again.",
			);
			setIsSubmitting(false);
			return;
		}

		await navigate({ to: "/" });
	}

	return (
		<Card className="auth-card" {...props}>
			<CardHeader>
				<CardTitle>Create an account</CardTitle>
				<CardDescription>Set up your private learning space.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="name">Full name</FieldLabel>
							<Input
								id="name"
								name="name"
								type="text"
								placeholder="Your name"
								autoComplete="name"
								disabled={isSubmitting}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
							<Input
								id="sign-up-email"
								name="email"
								type="email"
								placeholder="you@example.com"
								autoComplete="email"
								disabled={isSubmitting}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="new-password">Password</FieldLabel>
							<Input
								id="new-password"
								name="password"
								type="password"
								minLength={8}
								autoComplete="new-password"
								disabled={isSubmitting}
								required
							/>
							<FieldDescription>Use at least 8 characters.</FieldDescription>
						</Field>
						<Field>
							<FieldLabel htmlFor="confirm-password">
								Confirm password
							</FieldLabel>
							<Input
								id="confirm-password"
								name="confirmPassword"
								type="password"
								minLength={8}
								autoComplete="new-password"
								disabled={isSubmitting}
								required
							/>
						</Field>
						{error && <FieldError aria-live="polite">{error}</FieldError>}
						<Field>
							<Button
								className="auth-submit"
								type="submit"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Creating account…" : "Create account"}
							</Button>
							<FieldDescription className="text-center">
								Already have an account? <Link to="/sign-in">Sign in</Link>
							</FieldDescription>
						</Field>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}
