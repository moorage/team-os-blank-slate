import { afterEach, describe, expect, it } from "vitest";

import { applyNativeMutation, exportNativeSnapshot } from "../src/native.js";
import { createFixtureRepo, disposeFixtureRepo, readFixtureFile } from "./repo-fixture.js";

const fixtures: string[] = [];
const slowTestTimeout = 30_000;
const futureMutationTimestamp = "2099-05-04T16:20:00Z";
const futureSittingWithMutationTimestamp = "2099-05-04T16:35:00Z";

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

describe("native Team OS bridge", () => {
  it("exports the canonical repository snapshot without validation errors", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const snapshot = await exportNativeSnapshot(root);
    expect(snapshot.boards).toHaveLength(3);
    expect(snapshot.cards).toHaveLength(2);
    expect(snapshot.boards.find((board) => board.id === "product-dev")?.done_rules.shipped?.required_artifact_types).toEqual([
      "prd",
      "launch-readiness",
      "post-launch-review",
    ]);
    expect(snapshot.boards.find((board) => board.id === "product-dev")?.emoji).toBe("🧰");
    expect(snapshot.boards.find((board) => board.id === "product-dev")?.columns.find((column) => column.id === "discovery")?.emoji).toBe("🔍");
    expect(snapshot.comments_by_card_id["KAN-2026-0001"]).toHaveLength(1);
    const mattDirectoryEntry = snapshot.directory_entries.find((entry) => entry.id === "matt");
    const analyticsDirectoryEntry = snapshot.directory_entries.find((entry) => entry.id === "analytics");
    expect(mattDirectoryEntry?.github_handle).toBe("moorage");
    expect(mattDirectoryEntry?.handles.github).toBe("moorage");
    expect(mattDirectoryEntry?.path).toBe("team/people/matt.yaml");
    expect(mattDirectoryEntry?.status).toBe("active");
    expect(analyticsDirectoryEntry?.emoji).toBe("📈");
    expect(snapshot.validation_outcome.errors).toEqual([]);
  }, slowTestTimeout);

  it("creates a new card, appends a created event, and returns changed files", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      actor: "matt",
      board_id: "product-dev",
      card_type: "feature",
      emoji: "✨",
      owner: "matt",
      priority: "medium",
      summary: "Add a native card from the Team OS app bridge.",
      timestamp: "2026-05-04T16:10:00Z",
      title: "Native create card",
      type: "create-card",
    });

    expect(result.card_id).toBe("KAN-2026-0003");
    expect(result.changed_files.some((file) => file.path === "kanban/cards/KAN-2026-0003/card.md")).toBe(true);
    expect(
      result.changed_files.some(
        (file) => file.path === "kanban/cards/KAN-2026-0003/events/2026-05-04T16-10-00Z-created.yaml",
      ),
    ).toBe(true);
    expect(result.snapshot.cards.some((card) => card.id === "KAN-2026-0003")).toBe(true);

    const createdCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0003/card.md");
    expect(createdCard).toContain("title: Native create card");
    expect(createdCard).toContain("emoji: ✨");
  }, slowTestTimeout);

  it("moves a card across columns and writes a status event", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);
    const originalCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    const currentStatus = readFrontmatterField(originalCard, "status");
    const destinationColumnID = currentStatus === "delivery" ? "validation" : "delivery";

    const result = await applyNativeMutation(root, {
      actor: "matt",
      board_id: "product-dev",
      card_id: "KAN-2026-0001",
      column_id: destinationColumnID,
      destination_index: 0,
      timestamp: futureMutationTimestamp,
      type: "move-card",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/cards/KAN-2026-0001/card.md")).toBe(true);
    expect(
      result.changed_files.some(
        (file) => file.path === "kanban/cards/KAN-2026-0001/events/2099-05-04T16-20-00Z-status-changed.yaml",
      ),
    ).toBe(true);

    const movedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(movedCard).toContain(`status: ${destinationColumnID}`);
    expect(movedCard).toContain(`updated_at: '${futureMutationTimestamp}'`);
  }, slowTestTimeout);

  it("preserves distinct same-second status events for rapid native moves", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);
    const originalCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    const currentStatus = readFrontmatterField(originalCard, "status");
    const board = (await exportNativeSnapshot(root)).boards.find((entry) => entry.id === "product-dev");
    const candidateStatuses = board?.columns.map((column) => column.id).filter((statusID) => statusID !== currentStatus) ?? [];
    const [firstDestinationColumnID, secondDestinationColumnID] = candidateStatuses;

    if (!firstDestinationColumnID || !secondDestinationColumnID) {
      throw new Error("Fixture board does not have enough alternate statuses for the rapid move regression test.");
    }

    await applyNativeMutation(root, {
      actor: "matt",
      board_id: "product-dev",
      card_id: "KAN-2026-0001",
      column_id: firstDestinationColumnID,
      destination_index: 0,
      timestamp: "2099-05-04T16:20:00.111Z",
      type: "move-card",
    });

    const result = await applyNativeMutation(root, {
      actor: "matt",
      board_id: "product-dev",
      card_id: "KAN-2026-0001",
      column_id: secondDestinationColumnID,
      destination_index: 0,
      timestamp: "2099-05-04T16:20:00.222Z",
      type: "move-card",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/cards/KAN-2026-0001/card.md")).toBe(true);

    const firstEvent = await readFixtureFile(
      root,
      "kanban/cards/KAN-2026-0001/events/2099-05-04T16-20-00.111Z-status-changed.yaml",
    );
    expect(firstEvent).toContain(`status: ${firstDestinationColumnID}`);

    const secondEvent = await readFixtureFile(
      root,
      "kanban/cards/KAN-2026-0001/events/2099-05-04T16-20-00.222Z-status-changed.yaml",
    );
    expect(secondEvent).toContain(`status: ${secondDestinationColumnID}`);

    const movedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(movedCard).toContain(`status: ${secondDestinationColumnID}`);
    expect(movedCard).toContain("updated_at: '2099-05-04T16:20:00.222Z'");
  }, slowTestTimeout);

  it("updates a card emoji canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      actor: "matt",
      card_id: "KAN-2026-0002",
      emoji: "⚠️",
      timestamp: "2026-05-04T16:30:00Z",
      type: "set-card-emoji",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/cards/KAN-2026-0002/card.md")).toBe(true);
    const updatedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0002/card.md");
    expect(updatedCard).toContain("emoji: ⚠️");
  }, slowTestTimeout);

  it("updates a board column emoji canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      board_id: "product-dev",
      column_id: "delivery",
      emoji: "📦",
      type: "set-column-emoji",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/boards/product-dev.board.yaml")).toBe(true);
    const updatedBoard = await readFixtureFile(root, "kanban/boards/product-dev.board.yaml");
    expect(updatedBoard).toContain("  - id: delivery\n    label: Delivery\n    emoji: 📦");
    expect(result.snapshot.boards.find((board) => board.id === "product-dev")?.columns.find((column) => column.id === "delivery")?.emoji).toBe("📦");
  }, slowTestTimeout);

  it("updates a board emoji canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      board_id: "product-dev",
      emoji: "🗂️",
      type: "set-board-emoji",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/boards/product-dev.board.yaml")).toBe(true);
    const updatedBoard = await readFixtureFile(root, "kanban/boards/product-dev.board.yaml");
    expect(updatedBoard).toContain("emoji: 🗂️");
    expect(result.snapshot.boards.find((board) => board.id === "product-dev")?.emoji).toBe("🗂️");
  }, slowTestTimeout);

  it("updates a card owner canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const originalCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    const currentOwner = readFrontmatterField(originalCard, "owner");
    const nextOwner = currentOwner === "matt" ? "analytics" : "matt";

    const result = await applyNativeMutation(root, {
      actor: "matt",
      card_id: "KAN-2026-0001",
      owner: nextOwner,
      timestamp: "2026-05-04T16:32:00Z",
      type: "set-card-owner",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/cards/KAN-2026-0001/card.md")).toBe(true);
    const updatedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(updatedCard).toContain(`owner: ${nextOwner}`);
    expect(updatedCard).toContain("updated_at: '2026-05-04T16:32:00Z'");
  }, slowTestTimeout);

  it("updates a card title canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      actor: "matt",
      card_id: "KAN-2026-0001",
      timestamp: "2026-05-04T16:33:00Z",
      title: "Refine the family preferences quiz flow",
      type: "set-card-title",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/cards/KAN-2026-0001/card.md")).toBe(true);
    const updatedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(updatedCard).toContain("title: Refine the family preferences quiz flow");
    expect(updatedCard).toContain("updated_at: '2026-05-04T16:33:00Z'");
  }, slowTestTimeout);

  it("updates a card summary canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      actor: "matt",
      card_id: "KAN-2026-0001",
      summary: "Refine the quiz handoff copy and keep @analytics looped in.",
      timestamp: "2026-05-04T16:34:00Z",
      type: "set-card-summary",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/cards/KAN-2026-0001/card.md")).toBe(true);
    const updatedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(updatedCard).toContain("summary: Refine the quiz handoff copy and keep @analytics looped in.");
    expect(updatedCard).toContain("updated_at: '2026-05-04T16:34:00Z'");
  }, slowTestTimeout);

  it("updates sitting_with canonically and appends a sitting-with event", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const originalCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    const currentSittingWith = readFrontmatterField(originalCard, "sitting_with");
    const nextSittingWith = currentSittingWith === "analytics" ? "product" : "analytics";

    const result = await applyNativeMutation(root, {
      actor: "matt",
      card_id: "KAN-2026-0001",
      sitting_with: nextSittingWith,
      timestamp: futureSittingWithMutationTimestamp,
      type: "set-sitting-with",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/cards/KAN-2026-0001/card.md")).toBe(true);
    expect(
      result.changed_files.some(
        (file) => file.path === "kanban/cards/KAN-2026-0001/events/2099-05-04T16-35-00Z-sitting-with-changed.yaml",
      ),
    ).toBe(true);

    const updatedCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(updatedCard).toContain(`sitting_with: ${nextSittingWith}`);
    expect(updatedCard).toContain(`sitting_since: '${futureSittingWithMutationTimestamp}'`);

    const event = await readFixtureFile(
      root,
      "kanban/cards/KAN-2026-0001/events/2099-05-04T16-35-00Z-sitting-with-changed.yaml",
    );
    expect(event).toContain(`sitting_with: ${nextSittingWith}`);
    expect(event).toContain(`from_sitting_with: ${currentSittingWith}`);
  }, slowTestTimeout);

  it("adds a canonical comment file", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      author: "matt",
      body: "Bridge comments should persist immediately.",
      card_id: "KAN-2026-0001",
      role: "product",
      timestamp: "2026-05-04T16:40:00Z",
      type: "add-comment",
    });

    expect(
      result.changed_files.some(
        (file) => file.path === "kanban/cards/KAN-2026-0001/comments/2026-05-04T16-40-00Z-matt.md",
      ),
    ).toBe(true);
    const comment = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/comments/2026-05-04T16-40-00Z-matt.md");
    expect(comment).toContain("Bridge comments should persist immediately.");
  }, slowTestTimeout);

  it("stores separate light and dark column colors canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      board_id: "product-dev",
      column_id: "discovery",
      dark_background_hex: "#451A03",
      light_background_hex: "#D97706",
      type: "set-column-theme",
    });

    expect(result.changed_files.some((file) => file.path === "kanban/boards/product-dev.board.yaml")).toBe(true);
    const board = await readFixtureFile(root, "kanban/boards/product-dev.board.yaml");
    expect(board).toContain('light_background_hex: "#D97706"');
    expect(board).toContain('dark_background_hex: "#451A03"');
  }, slowTestTimeout);

  it("updates an existing team directory record canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      display_name: "Matthew Moore",
      emoji: null,
      handles: {
        github: "moorage",
        slack: "@matt",
      },
      profile_image_url: "https://example.com/matt.png",
      record_id: "matt",
      references: [
        "kanban/cards/KAN-2026-0001/card.md",
        "product-development/feature-index.yaml",
      ],
      status: "active",
      summary: "Primary human owner for the current Team OS repository.",
      type: "set-team-directory-record",
    });

    expect(result.changed_files.some((file) => file.path === "team/people/matt.yaml")).toBe(true);
    expect(result.snapshot.directory_entries.find((entry) => entry.id === "matt")?.display_name).toBe("Matthew Moore");
    expect(result.snapshot.directory_entries.find((entry) => entry.id === "matt")?.emoji).toBeNull();

    const record = await readFixtureFile(root, "team/people/matt.yaml");
    expect(record).toContain("display_name: Matthew Moore");
    expect(record).toContain("profile_image_url: https://example.com/matt.png");
    expect(record).toContain('  slack: "@matt"');
  }, slowTestTimeout);

  it("creates a new team directory record canonically", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      display_name: "Backend Platform",
      emoji: "🧱",
      handles: {
        slack: "@backend-platform",
      },
      kind: "functional-alias",
      record_id: "backend-platform",
      references: [],
      status: "active",
      summary: "Functional alias for platform ownership.",
      type: "create-team-directory-record",
    });

    expect(result.changed_files.some((file) => file.path === "team/people/index.yaml")).toBe(true);
    expect(result.changed_files.some((file) => file.path === "team/people/backend-platform.yaml")).toBe(true);
    expect(result.snapshot.directory_entries.find((entry) => entry.id === "backend-platform")?.display_name).toBe("Backend Platform");
    expect(result.snapshot.directory_entries.find((entry) => entry.id === "backend-platform")?.emoji).toBe("🧱");

    const index = await readFixtureFile(root, "team/people/index.yaml");
    expect(index).toContain("key: backend-platform");
    expect(index).toContain("kind: functional-alias");

    const record = await readFixtureFile(root, "team/people/backend-platform.yaml");
    expect(record).toContain("display_name: Backend Platform");
    expect(record).toContain("emoji: 🧱");
    expect(record).toContain("summary: Functional alias for platform ownership.");
    expect(record).toContain('  slack: "@backend-platform"');
  }, slowTestTimeout);

  it("appends a new canonical board column", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const result = await applyNativeMutation(root, {
      board_id: "product-dev",
      column_id: "qa-ready",
      label: "QA Ready",
      type: "add-board-column",
      wip_limit: 2,
    });

    expect(result.changed_files.some((file) => file.path === "kanban/boards/product-dev.board.yaml")).toBe(true);
    expect(
      result.snapshot.boards
        .find((board) => board.id === "product-dev")
        ?.columns.some((column) => column.id === "qa-ready" && column.label === "QA Ready" && column.wip_limit === 2),
    ).toBe(true);

    const board = await readFixtureFile(root, "kanban/boards/product-dev.board.yaml");
    expect(board).toContain("  - id: qa-ready");
    expect(board).toContain("    label: QA Ready");
    expect(board).toContain("    wip_limit: 2");
  }, slowTestTimeout);

  it("restores the repository when a mutation fails validation", async () => {
    const root = await createFixtureRepo();
    fixtures.push(root);

    const originalCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    await expect(
      applyNativeMutation(root, {
        actor: "matt",
        board_id: "product-dev",
        card_id: "KAN-2026-0001",
        column_id: "missing-column",
        destination_index: 0,
        timestamp: "2026-05-04T16:50:00Z",
        type: "move-card",
      }),
    ).rejects.toThrow(/missing-column/);

    const currentCard = await readFixtureFile(root, "kanban/cards/KAN-2026-0001/card.md");
    expect(currentCard).toBe(originalCard);
  }, slowTestTimeout);
});
