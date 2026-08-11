import { Link } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "#/components/ui/button";
import { signOut, useSession } from "#/lib/auth-client.ts";
import ThemeToggle from "./ThemeToggle.tsx";

export default function Header() {
	const { data: session, isPending } = useSession();
	const initials = session?.user.name
		? session.user.name
				.split(/\s+/)
				.map((part) => part[0])
				.join("")
				.slice(0, 2)
				.toUpperCase()
		: null;

	return (
		<header className="site-header">
			<nav className="site-nav" aria-label="Main navigation">
				<Link to="/" className="brand" aria-label="Bonsai home">
					<span className="brand-mark" aria-hidden="true">
						<span className="brand-leaf leaf-one" />
						<span className="brand-leaf leaf-two" />
						<span className="brand-stem" />
					</span>
					<span>Bonsai</span>
				</Link>

				<div className="site-nav-links">
					<a href="/#how-it-works">How it works</a>
					{session?.user ? (
						<Link to="/courses">My courses</Link>
					) : (
						<a href="/#manifesto">Manifesto</a>
					)}
				</div>

				<div className="site-nav-actions">
					<ThemeToggle />
					{session?.user ? (
						<details className="profile-menu">
							<summary
								className="profile-button"
								aria-label="Open profile menu"
							>
								<span className="profile-avatar" aria-hidden="true">
									{initials ?? <UserRound />}
								</span>
							</summary>
							<div className="profile-popover">
								<strong>{session.user.name}</strong>
								<span>{session.user.email}</span>
								<Button
									type="button"
									variant="ghost"
									onClick={() => void signOut()}
								>
									<LogOut aria-hidden="true" /> Sign out
								</Button>
							</div>
						</details>
					) : (
						<Link
							className="profile-button"
							to="/sign-in"
							aria-disabled={isPending}
						>
							<span className="profile-avatar" aria-hidden="true">
								<UserRound />
							</span>
						</Link>
					)}
					<a className="nav-cta" href="/#learning-description">
						Start growing
					</a>
				</div>
			</nav>
		</header>
	);
}
