import { afterEach, describe, expect, it } from "vitest";

import { renderAll } from "../src/render.js";
import { createFixtureRepo, disposeFixtureRepo, readFixtureFile } from "./repo-fixture.js";

const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => disposeFixtureRepo(root)));
});

describe("renderAll", () => {
  it("renders the committed Team OS views", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    await renderAll(root);

    const boardView = await readFixtureFile(root, "kanban/views/product-dev.md");
    expect(boardView).toContain("# Product development");
    expect(boardView).toContain("KAN-2026-0001");

    const blockedView = await readFixtureFile(root, "kanban/views/blocked.md");
    expect(blockedView).toContain("KAN-2026-0002");
  });

  it("keeps empty columns visible", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    await renderAll(root);

    const bugsView = await readFixtureFile(root, "kanban/views/bugs.md");
    expect(bugsView).toContain("## Fixing");
    expect(bugsView).toContain("No cards.");
  });
});
