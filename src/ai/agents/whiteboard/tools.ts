import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

export const createShapeDef = toolDefinition({
	name: "createShape",
	description: "Create a geometric shape. Coordinates use whiteboard page space.",
	inputSchema: z.object({
		type: z.enum(["rectangle", "ellipse", "triangle"]),
		x: z.number(),
		y: z.number(),
		w: z.number().positive(),
		h: z.number().positive(),
		text: z.string().describe("Shape label. Use an empty string for no label."),
	}),
	outputSchema: z.object({ id: z.string() }),
})
