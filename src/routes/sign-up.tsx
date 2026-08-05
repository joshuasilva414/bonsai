import { createFileRoute } from "@tanstack/react-router";
import { SignUpCard } from "#/components/auth/SignUpCard.tsx";

export const Route = createFileRoute("/sign-up")({
	head: () => ({
		meta: [
			{ title: "Create an account — Bonsai" },
			{
				name: "description",
				content: "Create your private Bonsai learning space.",
			},
		],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="auth-page">
			<section className="auth-shell" aria-labelledby="sign-up-title">
				<div className="auth-context">
					<p className="auth-kicker">Your private textbook</p>
					<h1 id="sign-up-title" className="display-title">
						Begin with what you want to understand.
					</h1>
					<p>
						Bonsai turns your own material into a structured path that becomes
						more useful as you study.
					</p>
				</div>
				<SignUpCard />
			</section>
		</main>
	);
}
