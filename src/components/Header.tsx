import { Link } from "@tanstack/react-router";

export default function Header() {
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
					<a href="#how-it-works">How it works</a>
					<a href="#manifesto">Manifesto</a>
				</div>

				<div className="site-nav-actions">
					<button className="text-button" type="button">
						Sign in
					</button>
					<a className="nav-cta" href="#learning-description">
						Start growing
					</a>
				</div>
			</nav>
		</header>
	);
}
