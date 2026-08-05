import { defineRelations } from "drizzle-orm";

import * as authSchema from "./auth-schema";
import * as curriculumSchema from "./curriculum-tree";

const schema = { ...authSchema, ...curriculumSchema };

export const relations = defineRelations(schema, (r) => ({
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		curricula: r.many.curriculum(),
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
	},
}));
