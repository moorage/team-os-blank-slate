import { afterEach, describe, expect, it } from "vitest";

import { renderCardHistory, renderStandup } from "../src/history.js";
import { createFixtureRepo, disposeFixtureRepo, readFixtureFile } from "./repo-fixture.js";

const fixtures: string[] = [];
const slowTestTimeout = 30_000;

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

describe("history surfaces", () => {
  it("renders card history in chronological order", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);
    const comment = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/comments/2026-05-04T12-00-00-matt.md");

    const history = await renderCardHistory(root, "KAN-2026-0001");
    const historyLines = history
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "));
    const createdIndex = historyLines.findIndex((line) => line.includes("| event:created |"));
    const commentIndex = historyLines.findIndex(
      (line) => line.includes(`| comment:${readFrontmatterField(comment, "author")} |`),
    );

    expect(history).toContain("# History for KAN-2026-0001");
    expect(createdIndex).toBeGreaterThanOrEqual(0);
    expect(commentIndex).toBeGreaterThan(createdIndex);
  }, slowTestTimeout);

  it("renders a standup summary with blocked and active work", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const standup = await renderStandup(root);
    const activeCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    const blockedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0002/card.md");
    expect(standup).toContain("## Blocked");
    expect(standup).toContain("KAN-2026-0002");
    expect(standup).toContain(readFrontmatterField(blockedCard, "title"));
    expect(standup).toContain("KAN-2026-0001");
    expect(standup).toContain(readFrontmatterField(activeCard, "title"));
  }, slowTestTimeout);
});
