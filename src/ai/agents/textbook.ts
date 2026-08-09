import { Agent, callable, type FiberRecoveryContext } from "agents";
import { nanoid } from "nanoid";
import { type CurriculumNode, inflateCurriculumTree } from "#/lib/curriculum";
import { loadCurriculumSubtreeRows } from "#/lib/db/queries";
import type { TextbookAgentMessage } from "#/lib/passage-stream";
import {
	type Passage,
	type PassageContinuation,
	passageClosingExcerpt,
} from "#/lib/passages";
import { generateNextPassage } from "../generate";
import { nextPassagePrompt } from "../prompts/next-passage";

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
			passageCount?: number;
			continuation?: PassageContinuation | null;
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
			(this.state.generation.status !== "idle" &&
				this.state.generation.status !== "failed")
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
					this.broadcastTextbookMessage({
						type: "passageStart",
						requestId,
					});

					const generatedPassage = await generateNextPassage(
						this.buildNextPassagePrompt(),
						ctx.signal,
						(update) => {
							if (ctx.signal.aborted) return;

							this.broadcastTextbookMessage({
								type: "passageProgress",
								requestId,
								...update,
							});
						},
					);
					if (ctx.signal.aborted) return;

					const passage: Passage = {
						content: generatedPassage.content,
					};
					const passageCount = (this.state.passageCount ?? 0) + 1;
					const continuation: PassageContinuation = {
						...generatedPassage.continuation,
						passageNumber: passageCount,
						closingExcerpt: passageClosingExcerpt(generatedPassage.content),
					};

					this.setState({
						...this.state,
						passageCount,
						continuation,
						generation: { status: "idle" },
					});

					this.broadcastTextbookMessage({
						type: "passageReady",
						requestId,
						passage,
					});
				} catch (error) {
					this.broadcastTextbookMessage({
						type: "passageFailed",
						requestId,
					});

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
			if (
				this.state.generation.status === "queued" ||
				this.state.generation.status === "running"
			) {
				this.broadcastTextbookMessage({
					type: "passageFailed",
					requestId: this.state.generation.requestId,
				});
			}

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
		if (this.state.status !== "ready") {
			throw new Error(
				"Textbook must be ready before building a passage prompt",
			);
		}

		return nextPassagePrompt({
			curriculumSubtree: this.state.curriculumSubtree,
			previousPassage: this.state.continuation ?? null,
		});
	}

	private broadcastTextbookMessage(message: TextbookAgentMessage) {
		this.broadcast(JSON.stringify(message));
	}

	async loadSubtree(nodeId: string): Promise<CurriculumNode> {
		const rows = await loadCurriculumSubtreeRows(this.env.DB, nodeId, {
			scope: "all",
		});

		return inflateCurriculumTree(rows, nodeId);
	}
}
