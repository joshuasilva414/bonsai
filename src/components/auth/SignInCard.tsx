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
import { signIn } from "#/lib/auth-client.ts";
import { cn } from "#/lib/utils.ts";

export function SignInCard({
	className,
	...props
}: React.ComponentProps<"div">) {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const form = new FormData(event.currentTarget);
		const result = await signIn.email({
			email: String(form.get("email")),
			password: String(form.get("password")),
		});

		if (result.error) {
			setError(result.error.message ?? "We couldn't sign you in. Try again.");
			setIsSubmitting(false);
			return;
		}

		await navigate({ to: "/" });
	}

	return (
		<div className={cn("auth-card-wrap", className)} {...props}>
			<Card className="auth-card">
				<CardHeader>
					<CardTitle>Sign in to Bonsai</CardTitle>
					<CardDescription>
						Use the email and password connected to your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="you@example.com"
									autoComplete="email"
									disabled={isSubmitting}
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<Input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
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
									{isSubmitting ? "Signing in…" : "Sign in"}
								</Button>
								<FieldDescription className="text-center">
									Don&apos;t have an account? <Link to="/sign-up">Sign up</Link>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
