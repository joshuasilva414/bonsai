import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";
import {
	generateCurriculumTree,
	generateSessionArtifactPlan,
	generateSessionOutline,
} from "#/ai/generate";
import { buildSessionArtifactPlanPrompt } from "#/ai/prompts/artifact-plan";
import { buildCreateCoursePrompt } from "#/ai/prompts/create-course";
import { buildSessionOutlinePrompt } from "#/ai/prompts/session-outline";
import { getNextSubtopic } from "#/functions/session";
import type { ArtifactPlan } from "#/lib/artifacts";
import type { Subject } from "#/lib/curriculum";
import { flattenCurriculumTree } from "#/lib/curriculum";
import {
	saveCurriculumTree,
	savePreparedLearningSession,
} from "#/lib/db/queries";

type UserInfo = { userId: string };

type CreateCourseWorkflowParams = { description: string } & UserInfo;

export class CreateCourseWorkflow extends WorkflowEntrypoint<
	Env,
	CreateCourseWorkflowParams
> {
	async run(
		event: WorkflowEvent<CreateCourseWorkflowParams>,
		step: WorkflowStep,
	) {
		const tree: Subject = await step.do(
			"generate curriculum tree",
			async () => {
				const result = await generateCurriculumTree(
					buildCreateCoursePrompt`${event.payload.description}`,
				);
				// console.log(JSON.stringify(tree));
				return result;
			},
		);

		const courseId = await step.do("save curriculum tree", async () => {
			const { curriculum, nodes } = flattenCurriculumTree(
				tree,
				event.payload.userId,
			);
			return await saveCurriculumTree(curriculum, nodes);
		});

		const firstSessionWorkflowId = await step.do(
			"start first session workflow",
			async (): Promise<string> => {
				const instance = await this.env.PREPARE_SESSION_WORKFLOW.create({
					params: {
						courseId,
						userId: event.payload.userId,
					},
				});
				return instance.id;
			},
		);

		return {
			tree,
			firstSessionWorkflowId,
			courseId,
		};
	}
}

type PrepareSessionParams = { courseId: string } & UserInfo;
export class PrepareSessionWorkflow extends WorkflowEntrypoint<
	Env,
	PrepareSessionParams
> {
	async run(event: WorkflowEvent<PrepareSessionParams>, step: WorkflowStep) {
		const sessionId = event.instanceId;

		// Get the next whole subtopic to use as this session's scope.
		const sessionPreparationContext = await step.do(
			"get session context",
			async () => {
				const lastSession = null;
				const nextSubtopic = await getNextSubtopic(
					event.payload.courseId,
					event.payload.userId,
				);
				if (!nextSubtopic) {
					throw new Error("No subtopic is available for this course");
				}
				return { lastSession, nextSubtopic };
			},
		);

		// Generate session outline
		const sessionOutline = await step.do(
			"generate session outline",
			async () => {
				return await generateSessionOutline(
					buildSessionOutlinePrompt(sessionPreparationContext),
				);
			},
		);

		// Generate artifact plan
		const artifactPlan = await step.do("generate artifact plan", async () => {
			return await generateSessionArtifactPlan(
				buildSessionArtifactPlanPrompt(
					sessionPreparationContext,
					sessionOutline,
				),
			);
		});

		const artifactWorkflowId = await step.do(
			"start artifact generation workflow",
			async () => {
				const params: GenerateArtifactParams = {
					artifactPlan,
					sessionId,
					userId: event.payload.userId,
				};

				try {
					const instance = await this.env.GENERATE_ARTIFACT_WORKFLOW.create({
						id: sessionId,
						params,
					});
					return instance.id;
				} catch (createError) {
					const existing =
						await this.env.GENERATE_ARTIFACT_WORKFLOW.get(sessionId);
					const { status } = await existing.status();

					if (status === "unknown") throw createError;

					return existing.id;
				}
			},
		);

		const savedSessionId = await step.do(
			"save session outline and artifact workflow id",
			async () => {
				return await savePreparedLearningSession({
					id: sessionId,
					courseId: event.payload.courseId,
					userId: event.payload.userId,
					subtopicId: sessionPreparationContext.nextSubtopic.id,
					outline: sessionOutline,
					artifactPlan,
					artifactWorkflowId,
					status: "prepared",
				});
			},
		);

		return {
			sessionId: savedSessionId,
			artifactGenerationWorkflowId: artifactWorkflowId,
			sessionOutline,
			artifactPlan,
		};
	}
}

type GenerateArtifactParams = {
	artifactPlan: ArtifactPlan;
	sessionId: string;
} & UserInfo;
export class GenerateArtifactWorkflow extends WorkflowEntrypoint<
	Env,
	GenerateArtifactParams
> {
	async run(event: WorkflowEvent<GenerateArtifactParams>, step: WorkflowStep) {
		const artifact = await step.do("generate artifact", async () => {
			const _ = event.payload;
		});
		return { artifact };
	}
}
