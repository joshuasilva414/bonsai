import { z } from "zod";
export const ArtifactPlanSchema = z.object({
	type: z.enum(["diagram", "quiz", "demo"]),
	description: z.string().max(200),
	requirements: z.string().max(200),
});
export type ArtifactPlan = z.infer<typeof ArtifactPlanSchema>;
