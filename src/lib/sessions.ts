import { z } from "zod";

export type SessionPreparationContext = {
	lastSession: { name: string } | null;
	nextSubtopic: {
		name: string;
		objectives: ReadonlyArray<{ name: string }>;
	};
};

export const SessionOutlineSchema = z.object({
	content: z.string().min(100),
});

export type SessionOutline = z.infer<typeof SessionOutlineSchema>;
