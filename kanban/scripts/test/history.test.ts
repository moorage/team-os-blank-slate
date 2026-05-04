import { afterEach, describe, expect, it } from "vitest";

import { renderCardHistory, renderStandup } from "../src/history.js";
import { createFixtureRepo, disposeFixtureRepo } from "./repo-fixture.js";

const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => disposeFixtureRepo(root)));
});

describe("history surfaces", () => {
  it("renders card history in chronological order", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const history = await renderCardHistory(root, "KAN-2026-0001");
    const createdIndex = history.indexOf("2026-05-04T09:12:33Z");
    const commentIndex = history.indexOf("2026-05-04T12:00:00Z");

    expect(history).toContain("# History for KAN-2026-0001");
    expect(createdIndex).toBeGreaterThanOrEqual(0);
    expect(commentIndex).toBeGreaterThan(createdIndex);
  });

  it("renders a standup summary with blocked and active work", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const standup = await renderStandup(root);
    expect(standup).toContain("## Blocked");
    expect(standup).toContain("KAN-2026-0002");
    expect(standup).toContain("KAN-2026-0001");
  });
});
