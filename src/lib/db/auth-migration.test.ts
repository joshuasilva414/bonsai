import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const migrationsDirectory = new URL("../../../drizzle/", import.meta.url);
const migrationNames = readdirSync(migrationsDirectory).sort();

function applyMigration(db: DatabaseSync, name: string) {
	db.exec(
		readFileSync(new URL(`${name}/migration.sql`, migrationsDirectory), "utf8"),
	);
}

test("migrates existing credential accounts without losing their passwords", () => {
	using db = new DatabaseSync(":memory:");
	db.exec("PRAGMA foreign_keys = ON");
	const issuerMigration = migrationNames.find((name) =>
		name.endsWith("_account-issuer"),
	);
	assert.ok(issuerMigration, "Missing account issuer migration");
	for (const name of migrationNames) {
		if (name >= issuerMigration) break;
		applyMigration(db, name);
	}
	db.exec(`
		INSERT INTO user (id, name, email) VALUES ('user-1', 'Test', 'test@example.com');
		INSERT INTO account (id, account_id, provider_id, user_id, password, updated_at)
		VALUES ('account-1', 'user-1', 'credential', 'user-1', 'existing-password-hash', 1234);
	`);
	const before = db.prepare("SELECT * FROM account").get();

	applyMigration(db, issuerMigration);

	assert.deepEqual(
		{ ...db.prepare("SELECT * FROM account").get() },
		{ ...before, issuer: "local:credential" },
	);
	assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
	assert.throws(
		() =>
			db.exec(`
				INSERT INTO account (id, account_id, provider_id, issuer, user_id, updated_at)
				VALUES ('duplicate', 'user-1', 'credential', 'local:credential', 'user-1', 1234)
			`),
		/UNIQUE constraint failed/,
	);
	assert.throws(
		() => db.exec("UPDATE account SET issuer = NULL"),
		/NOT NULL constraint failed/,
	);
});

test("applies the migration history to an empty database", () => {
	using db = new DatabaseSync(":memory:");
	db.exec("PRAGMA foreign_keys = ON");
	for (const name of migrationNames) applyMigration(db, name);
	db.prepare("SELECT issuer FROM account").all();
	assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});
