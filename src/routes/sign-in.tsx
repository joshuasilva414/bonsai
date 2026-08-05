import { createFileRoute } from "@tanstack/react-router";
import { SignInCard } from "#/components/auth/SignInCard.tsx";

export const Route = createFileRoute("/sign-in")({
	head: () => ({
		meta: [
			{ title: "Sign in — Bonsai" },
			{
				name: "description",
				content: "Sign in to continue growing your adaptive learning path.",
			},
		],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="auth-page">
			<section className="auth-shell" aria-labelledby="sign-in-title">
				<div className="auth-context">
					<p className="auth-kicker">Welcome back</p>
					<h1 id="sign-in-title" className="display-title">
						Return to your learning path.
					</h1>
					<p>
						Your sources, course structure, and progress are ready where you
						left them.
					</p>
				</div>
				<SignInCard />
			</section>
		</main>
	);
}
