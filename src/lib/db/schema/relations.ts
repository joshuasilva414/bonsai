import { defineRelations } from "drizzle-orm";

import * as authSchema from "./auth-schema";
import * as curriculumSchema from "./curriculum-tree";
import * as learningSessionSchema from "./learning-session";

const schema = {
	...authSchema,
	...curriculumSchema,
	...learningSessionSchema,
};

export const relations = defineRelations(schema, (r) => ({
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		curricula: r.many.curriculum(),
		learningSessions: r.many.learningSession(),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},
	curriculum: {
		user: r.one.user({
			from: r.curriculum.userId,
			to: r.user.id,
		}),
		nodes: r.many.curriculumNode(),
		learningSessions: r.many.learningSession(),
	},
	curriculumNode: {
		curriculum: r.one.curriculum({
			from: r.curriculumNode.curriculumId,
			to: r.curriculum.id,
		}),
		parent: r.one.curriculumNode({
			from: r.curriculumNode.parentId,
			to: r.curriculumNode.id,
			optional: true,
			alias: "curriculumNodeParent",
		}),
		children: r.many.curriculumNode({
			alias: "curriculumNodeParent",
		}),
		learningSessions: r.many.learningSession(),
	},
	learningSession: {
		user: r.one.user({
			from: r.learningSession.userId,
			to: r.user.id,
		}),
		curriculum: r.one.curriculum({
			from: r.learningSession.courseId,
			to: r.curriculum.id,
		}),
		subtopic: r.one.curriculumNode({
			from: r.learningSession.subtopicId,
			to: r.curriculumNode.id,
		}),
	},
}));
