import {
	Agent,
	callable,
	type FiberRecoveryContext,
	type FiberRecoveryResult,
} from "agents";
import { nanoid } from "nanoid";
import { type CurriculumNode, inflateCurriculumTree } from "#/lib/curriculum";
import { loadCurriculumSubtreeRows } from "#/lib/db/queries";
import type { Passage } from "#/lib/passages";
import { generateNextPassage } from "../generate";

type PassageReadyMessage = {
	type: "passageReady";
	passage: Passage;
};

export type TextbookState =
	| {
			status: "uninitialized";
			nodeId: null;
			currentObjectiveId: null;
			curriculumSubtree: null;
	  }
	| {
			status: "ready";
			nodeId: string;
			currentObjectiveId: string | null;
			curriculumSubtree: CurriculumNode;
			generation:
				| { status: "idle" }
				| { status: "queued" | "running"; requestId: string }
				| { status: "failed"; message: string };
	  }
	| {
			status: "done";
			nodeId: string;
			currentObjective: string;
			curriculumSubtree: CurriculumNode;
	  };

export type TextbookProps = {
	nodeId: string;
};

export class TextbookAgent extends Agent<Env, TextbookState, TextbookProps> {
	initialState: TextbookState = {
		status: "uninitialized",
		nodeId: null,
		currentObjectiveId: null,
		curriculumSubtree: null,
	};

	async onStart(props?: TextbookProps) {
		if (this.state.status === "ready") {
			if (props && props.nodeId !== this.state.nodeId) {
				throw new Error("Agent nodeId cannot be changed");
			}
			return;
		}

		if (!props?.nodeId) {
			throw new Error("nodeId is required for initialization");
		}

		const curriculumSubtree = await this.loadSubtree(props.nodeId);

		this.setState({
			status: "ready",
			nodeId: props.nodeId,
			currentObjectiveId: null,
			curriculumSubtree,
			generation: {
				status: "idle",
			},
		});
	}

	@callable()
	async requestReadAhead() {
		if (
			this.state.status !== "ready" ||
			this.state.generation.status !== "idle"
		) {
			return { accepted: false };
		}

		const requestId = nanoid();

		this.setState({
			...this.state,
			generation: {
				status: "queued",
				requestId,
			},
		});

		const receipt = await this.startFiber(
			"generate-next-passage",
			async (ctx) => {
				if (this.state.status !== "ready") return;

				this.setState({
					...this.state,
					generation: {
						status: "running",
						requestId,
					},
				});

				try {
					const text = await generateNextPassage(
						this.buildNextPassagePrompt(),
						ctx.signal,
					);
					if (ctx.signal.aborted) return;

					const passage: Passage = {
						content: text,
					};

					this.broadcast(
						JSON.stringify({
							type: "passageReady",
							passage,
						} satisfies PassageReadyMessage),
					);

					if (this.state.status === "ready") {
						this.setState({
							...this.state,
							generation: { status: "idle" },
						});
					}
				} catch (error) {
					if (this.state.status === "ready") {
						this.setState({
							...this.state,
							generation: {
								status: "failed",
								message:
									error instanceof Error
										? error.message
										: "Passage generation failed",
							},
						});
					}
					throw error;
				}
			},
			{
				idempotencyKey: `next-passage:${this.state.nodeId}:${requestId}`,
				metadata: {
					nodeId: this.state.nodeId,
					requestId,
				},
			},
		);

		return {
			accepted: receipt.accepted,
			requestId,
		};
	}

	async onFiberRecovered(ctx: FiberRecoveryContext) {
		if (ctx.name !== "generate-next-passage") return;

		if (this.state.status === "ready") {
			this.setState({
				...this.state,
				generation: {
					status: "failed",
					message: "Passage generation was interrupted. Scroll to retry.",
				},
			});
		}

		return {
			status: "error" as const,
			error: "Passage generation interrupted",
		};
	}

	private buildNextPassagePrompt(): string {
		return `Generate the next textbook passage for: ${JSON.stringify(this.state.curriculumSubtree)}`;
	}

	async loadSubtree(nodeId: string): Promise<CurriculumNode> {
		const rows = await loadCurriculumSubtreeRows(this.env.DB, nodeId, {
			scope: "all",
		});

		return inflateCurriculumTree(rows, nodeId);
	}
}
