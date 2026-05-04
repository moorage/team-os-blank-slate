import { afterEach, describe, expect, it } from "vitest";

import { validateRepository } from "../src/validate.js";
import { createFixtureRepo, disposeFixtureRepo, readFixtureFile, writeFixtureFile } from "./repo-fixture.js";

const fixtures: string[] = [];

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
  });

  it("fails when current status no longer matches the latest status event", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const cardPath = "kanban/cards/KAN-2026-0001/card.md";
    const original = await readFixtureFile(root, cardPath);
    await writeFixtureFile(root, cardPath, original.replace("status: discovery", "status: delivery"));

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("status-history-mismatch");
  });

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
  });

  it("fails when a card identity field is missing from the team directory", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const cardPath = "kanban/cards/KAN-2026-0001/card.md";
    const original = await readFixtureFile(root, cardPath);
    await writeFixtureFile(root, cardPath, original.replace("owner: matt", "owner: missing-person"));

    await expect(validateRepository(root)).rejects.toThrow(/Validation failed/);
    const report = await readFixtureFile(root, "kanban/views/validation-errors.md");
    expect(report).toContain("unknown-team-identifier");
    expect(report).toContain("team/people/index.yaml");
  });
});
