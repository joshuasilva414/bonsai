import { Agent } from "agents";
import { type CurriculumNode, inflateCurriculumTree } from "#/lib/curriculum";
import { loadCurriculumSubtreeRows } from "#/lib/db/queries";

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
		});
	}

	async loadSubtree(nodeId: string): Promise<CurriculumNode> {
		const rows = await loadCurriculumSubtreeRows(this.env.DB, nodeId, {
			scope: "all",
		});

		return inflateCurriculumTree(rows, nodeId);
	}
}
