import { afterEach, describe, expect, it } from "vitest";

import { validateRepository } from "../src/validate.js";
import { createFixtureRepo, disposeFixtureRepo, readFixtureFile, writeFixtureFile } from "./repo-fixture.js";

const fixtures: string[] = [];
const slowTestTimeout = 30_000;

function replaceFrontmatterField(source: string, field: string, value: string): string {
  return source.replace(new RegExp(`^${field}:.*$`, "m"), `${field}: ${value}`);
}

function readFrontmatterField(source: string, field: string): string {
  const match = source.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
  const value = match?.[1];
  if (value == null) {
    throw new Error(`Missing frontmatter field: ${field}`);
  }
  return value.trim().replace(/^['"]|['"]$/g, "");
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => disposeFixtureRepo(root)));
});

describe("validateRepository", () => {
  it("passes for the committed Team OS sample data", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await validateRepository(root);
    expect(result.errors).toHaveLength(0);

    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("No validation errors found.");
  }, slowTestTimeout);

  it("fails when current status no longer matches the latest status event", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const cardPath = "kanban/cards/KAN-2026-0001/card.md";
    const original = await readFixtureFile(root, cardPath);
    const currentStatus = readFrontmatterField(original, "status");
    const mismatchedStatus = currentStatus === "delivery" ? "validation" : "delivery";
    await writeFixtureFile(root, cardPath, replaceFrontmatterField(original, "status", mismatchedStatus));

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("status-history-mismatch");
  }, slowTestTimeout);

  it("fails when column_order values are not contiguous inside a board column", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const cardPath = "kanban/cards/KAN-2026-0001/card.md";
    const original = await readFixtureFile(root, cardPath);
    await writeFixtureFile(root, cardPath, replaceFrontmatterField(original, "column_order", "3"));

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("noncontiguous-column-order");
  }, slowTestTimeout);

  it("fails when a board column background color is not valid hex", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const boardPath = "kanban/boards/product-dev.board.yaml";
    const original = await readFixtureFile(root, boardPath);
    await writeFixtureFile(
      root,
      boardPath,
      original.replace("    label: Discovery\n", "    label: Discovery\n    background_hex: \"amber\"\n"),
    );

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("malformed-board");
    expect(report).toContain("hex color");
  }, slowTestTimeout);

  it("fails when a board column emoji is not a single emoji grapheme", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const boardPath = "kanban/boards/product-dev.board.yaml";
    const original = await readFixtureFile(root, boardPath);
    await writeFixtureFile(
      root,
      boardPath,
      original.replace("    emoji: 🔍\n", "    emoji: discovery\n"),
    );

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("malformed-board");
    expect(report).toContain("single emoji grapheme");
  }, slowTestTimeout);

  it("fails when a board emoji is not a single emoji grapheme", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const boardPath = "kanban/boards/product-dev.board.yaml";
    const original = await readFixtureFile(root, boardPath);
    await writeFixtureFile(root, boardPath, original.replace(/^emoji:\s*.+$/m, "emoji: product"));

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("malformed-board");
    expect(report).toContain("single emoji grapheme");
  }, slowTestTimeout);

  it("fails when a team directory emoji is not a single emoji grapheme", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const recordPath = "team/people/backend-eng.yaml";
    const original = await readFixtureFile(root, recordPath);
    await writeFixtureFile(root, recordPath, original.replace(/^emoji:\s*.+$/m, "emoji: backend"));

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("malformed-team-directory");
    expect(report).toContain("single emoji grapheme");
  }, slowTestTimeout);

  it("fails when a board defines duplicate column IDs", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const boardPath = "kanban/boards/product-dev.board.yaml";
    const original = await readFixtureFile(root, boardPath);
    await writeFixtureFile(
      root,
      boardPath,
      original.replace(
        "    label: Discovery\n",
        "    label: Discovery\n  - id: discovery\n    label: Duplicate Discovery\n",
      ),
    );

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("duplicate-board-column-id");
  }, slowTestTimeout);

  it("reports malformed comment frontmatter and invalid event types", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    await writeFixtureFile(
      root,
      "kanban/cards/KAN-2026-0001/comments/2026-05-04T12-00-00-matt.md",
      "---\ncard_id: KAN-2026-0001\ncreated_at: 2026-05-04T12:00:00Z\nrole: product\n---\n\nMissing author.\n",
    );
    await writeFixtureFile(
      root,
      "kanban/cards/KAN-2026-0002/events/2026-05-04T10-45-00-blocked.yaml",
      "timestamp: 2026-05-04T10:45:00Z\ntype: impossible\nauthor: matt\ncard_id: KAN-2026-0002\nsummary: Broken event.\n",
    );

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("malformed-comment");
    expect(report).toContain("malformed-event");
  }, slowTestTimeout);

  it("fails when a card identity field is missing from the team directory", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const cardPath = "kanban/cards/KAN-2026-0001/card.md";
    const original = await readFixtureFile(root, cardPath);
    await writeFixtureFile(root, cardPath, replaceFrontmatterField(original, "owner", "missing-person"));

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("unknown-team-identifier");
    expect(report).toContain("team/people/index.yaml");
  }, slowTestTimeout);

  it("fails when a card emoji is not a single emoji grapheme", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const cardPath = "kanban/cards/KAN-2026-0001/card.md";
    const original = await readFixtureFile(root, cardPath);
    await writeFixtureFile(root, cardPath, replaceFrontmatterField(original, "emoji", "soon"));

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("malformed-card");
    expect(report).toContain("single emoji grapheme");
  }, slowTestTimeout);
});
