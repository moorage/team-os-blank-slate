import { afterEach, describe, expect, it } from "vitest";

import { renderAll } from "../src/render.js";
import { createFixtureRepo, disposeFixtureRepo, readFixtureFile } from "./repo-fixture.js";
import { writeFixtureFile } from "./repo-fixture.js";

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

function formatRenderedCardLine(cardSource: string): string {
  const cardID = readFrontmatterField(cardSource, "id");
  const title = readFrontmatterField(cardSource, "title");
  const emoji = cardSource
    .match(/^emoji:\s*(.+)$/m)?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, "");
  return `${cardID} — ${emoji ? `${emoji} ` : ""}${title}`;
}

function formatRenderedBoardHeading(boardSource: string): string {
  const name = readFrontmatterField(boardSource, "name");
  const emoji = boardSource
    .match(/^emoji:\s*(.+)$/m)?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, "");
  return `# ${emoji ? `${emoji} ` : ""}${name}`;
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => disposeFixtureRepo(root)));
});

describe("renderAll", () => {
  it("renders the committed Team OS views", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    await renderAll(root);

    const boardView = await readFixtureFile(root, "kanban/views/product-dev.md");
    const boardSource = await readFixtureFile(root, "kanban/boards/product-dev.board.yaml");
    const firstCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(boardView).toContain(formatRenderedBoardHeading(boardSource));
    expect(boardView).toContain(formatRenderedCardLine(firstCard));

    const blockedView = await readFixtureFile(root, "kanban/views/blocked.md");
    const blockedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0002/card.md");
    expect(blockedView).toContain("KAN-2026-0002");
    expect(blockedView).toContain(readFrontmatterField(blockedCard, "title"));
  }, slowTestTimeout);

  it("keeps empty columns visible", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    await renderAll(root);

    const bugsView = await readFixtureFile(root, "kanban/views/bugs.md");
    expect(bugsView).toContain("## 🛠️ Fixing");
    expect(bugsView).toContain("No cards.");
  }, slowTestTimeout);

  it("renders a board column background color when one is configured", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const boardPath = "kanban/boards/product-dev.board.yaml";
    const originalBoard = await readFixtureFile(root, boardPath);
    await writeFixtureFile(
      root,
      boardPath,
      originalBoard.replace("    label: Discovery\n", "    label: Discovery\n    background_hex: \"#d97706\"\n"),
    );

    await renderAll(root);

    const boardView = await readFixtureFile(root, "kanban/views/product-dev.md");
    expect(boardView).toContain("## 🔍 Discovery · background #D97706");
  }, slowTestTimeout);

  it("renders a board column emoji inline with the heading", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const boardPath = "kanban/boards/product-dev.board.yaml";
    const originalBoard = await readFixtureFile(root, boardPath);
    await writeFixtureFile(
      root,
      boardPath,
      originalBoard.replace("    emoji: 🔍\n", "    emoji: 📋\n"),
    );

    await renderAll(root);

    const boardView = await readFixtureFile(root, "kanban/views/product-dev.md");
    expect(boardView).toContain("## 📋 Discovery");
  }, slowTestTimeout);

  it("renders a board emoji inline with the board heading", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const boardPath = "kanban/boards/product-dev.board.yaml";
    const originalBoard = await readFixtureFile(root, boardPath);
    await writeFixtureFile(
      root,
      boardPath,
      originalBoard.replace(/^emoji:\s*.+$/m, "emoji: 🗂️"),
    );

    await renderAll(root);

    const boardView = await readFixtureFile(root, "kanban/views/product-dev.md");
    expect(boardView).toContain("# 🗂️ Product development");
  }, slowTestTimeout);

  it("renders distinct light and dark column background colors when both are configured", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const boardPath = "kanban/boards/product-dev.board.yaml";
    const originalBoard = await readFixtureFile(root, boardPath);
    await writeFixtureFile(
      root,
      boardPath,
      originalBoard.replace(
        "    label: Discovery\n",
        "    label: Discovery\n    light_background_hex: \"#d97706\"\n    dark_background_hex: \"#451a03\"\n",
      ),
    );

    await renderAll(root);

    const boardView = await readFixtureFile(root, "kanban/views/product-dev.md");
    expect(boardView).toContain("## 🔍 Discovery · light #D97706 · dark #451A03");
  }, slowTestTimeout);

  it("renders cards within a column by column_order before card id", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const secondCard = `---
id: KAN-2026-0003
title: Discovery follow-up
emoji: 📋
type: feature
board: product-dev
status: discovery
column_order: 1
priority: medium
severity:
owner: matt
assignees:
  - product
reviewers: []
watchers: []
collaborators: []
sitting_with:
sitting_reason:
sitting_since:
sitting_expected_action:
created_at: 2026-05-04T09:30:00Z
updated_at: 2026-05-04T09:30:00Z
summary: Follow-up work that should appear before the existing discovery card.
feature_index_key:
artifacts: []
---

## Why this card exists

Test ordering.
`;
    await writeFixtureFile(root, "kanban/cards/KAN-2026-0003/card.md", secondCard);
    const existingCardPath = "kanban/cards/KAN-2026-0001/card.md";
    const existingCard = await readFixtureFile(root, existingCardPath);
    await writeFixtureFile(
      root,
      existingCardPath,
      existingCard
        .replace(/^status:\s*.+$/m, "status: discovery")
        .replace(/^column_order:\s*.+$/m, "column_order: 2"),
    );

    await renderAll(root);

    const boardView = await readFixtureFile(root, "kanban/views/product-dev.md");
    const updatedExistingCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(boardView.indexOf("KAN-2026-0003 — 📋 Discovery follow-up")).toBeLessThan(
      boardView.indexOf(formatRenderedCardLine(updatedExistingCard)),
    );
  }, slowTestTimeout);
});
