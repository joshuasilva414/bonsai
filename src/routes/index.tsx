import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import startCreateCourseWorkflow from "#/functions/startCreateCourseWorkflow";

export const Route = createFileRoute("/")({ component: HomePage });

const starterPrompts = [
	"Prepare me for my data structures midterm",
	"Teach me algorithms from first principles",
	"Turn my course notes into a study path",
];

function HomePage() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [description, setDescription] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [submitted, setSubmitted] = useState(false);

	const workflow = useServerFn(startCreateCourseWorkflow);
	const navigate = useNavigate({ from: "/" });

	function addFiles(fileList: FileList | null) {
		if (!fileList) return;

		setFiles((current) => {
			const next = [...current];
			for (const file of Array.from(fileList)) {
				const isDuplicate = next.some(
					(item) => item.name === file.name && item.size === file.size,
				);
				if (!isDuplicate) next.push(file);
			}
			return next;
		});
	}

	function removeFile(index: number) {
		setFiles((current) =>
			current.filter((_, fileIndex) => fileIndex !== index),
		);
	}

	async function submitLearningGoal(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!description.trim() && files.length === 0) return;

		const { success, workflowId } = await workflow({ data: { description } });

		if (!success) return;

		navigate({ to: "/wait", search: { workflowId } });

		setSubmitted(true);
	}

	return (
		<main className="bonsai-home">
			<div className="ambient-orb ambient-orb-left" aria-hidden="true" />
			<div className="ambient-orb ambient-orb-right" aria-hidden="true" />

			<section className="hero-section" aria-labelledby="hero-title">
				<div className="hero-eyebrow rise-in">
					<span className="eyebrow-mark" aria-hidden="true">
						✦
					</span>
					Your private, adaptive learning space
				</div>

				<h1 id="hero-title" className="hero-title rise-in">
					Grow what you <em>want</em> to know.
				</h1>
				<p id="manifesto" className="hero-copy rise-in">
					Bring the material. Tell us where you want to go. Bonsai turns it into
					a living path that learns alongside you.
				</p>

				<form
					className="learning-composer rise-in"
					onSubmit={submitLearningGoal}
				>
					<label className="sr-only" htmlFor="learning-description">
						Describe what you want to learn
					</label>
					<textarea
						id="learning-description"
						value={description}
						onChange={(event) => {
							setDescription(event.target.value);
							setSubmitted(false);
						}}
						placeholder="What do you want to learn? Include your goals, what you already know, and anything you find difficult…"
						rows={6}
					/>

					{files.length > 0 && (
						<ul className="attachment-list" aria-label="Attached files">
							{files.map((file, index) => (
								<li
									className="attachment-chip"
									key={`${file.name}-${file.size}`}
								>
									<span className="file-page" aria-hidden="true" />
									<span className="attachment-name">{file.name}</span>
									<button
										type="button"
										onClick={() => removeFile(index)}
										aria-label={`Remove ${file.name}`}
									>
										×
									</button>
								</li>
							))}
						</ul>
					)}

					<div className="composer-footer">
						<div className="composer-actions">
							<input
								ref={fileInputRef}
								className="sr-only"
								type="file"
								multiple
								accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
								onChange={(event) => {
									addFiles(event.target.files);
									event.currentTarget.value = "";
									setSubmitted(false);
								}}
							/>
							<button
								className="attach-button"
								type="button"
								onClick={() => fileInputRef.current?.click()}
							>
								<span className="paperclip" aria-hidden="true">
									+
								</span>
								Attach sources
							</button>
							<span className="file-hint">PDF, DOCX, TXT, PPTX</span>
						</div>

						<button
							className="grow-button"
							type="submit"
							disabled={!description.trim() && files.length === 0}
						>
							Grow my path
							<span aria-hidden="true">→</span>
						</button>
					</div>
				</form>

				<fieldset className="prompt-starters rise-in">
					<legend>Try asking</legend>
					{starterPrompts.map((prompt) => (
						<button
							key={prompt}
							type="button"
							onClick={() => {
								setDescription(prompt);
								setSubmitted(false);
							}}
						>
							{prompt}
						</button>
					))}
				</fieldset>

				<output
					className={`composer-status${submitted ? " is-visible" : ""}`}
					aria-live="polite"
				>
					Your sources and goal are ready. Graph generation comes next.
				</output>
			</section>

			<section
				id="how-it-works"
				className="trust-strip"
				aria-label="How Bonsai helps you learn"
			>
				<div>
					<span className="trust-icon" aria-hidden="true">
						01
					</span>
					<p>
						<strong>Bring your material</strong>
						Syllabi, notes, slides, and reading lists.
					</p>
				</div>
				<div>
					<span className="trust-icon" aria-hidden="true">
						02
					</span>
					<p>
						<strong>Get a living knowledge path</strong>
						Connected concepts, ordered around you.
					</p>
				</div>
				<div>
					<span className="trust-icon" aria-hidden="true">
						03
					</span>
					<p>
						<strong>Learn, reflect, adapt</strong>
						Every question shapes what comes next.
					</p>
				</div>
			</section>
		</main>
	);
}
