import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { daysBetween, newestTimestamp } from "./dates.js";
import { compareCardIds } from "./ids.js";
import { loadBoards, loadCards } from "./load.js";
import type { Board, CardRecord } from "./schemas.js";

function displayCardTitle(card: CardRecord): string {
  const emojiPrefix = card.frontmatter.emoji ? `${card.frontmatter.emoji} ` : "";
  return `${emojiPrefix}${card.frontmatter.title}`;
}

function latestActivity(card: CardRecord): string {
  const timestamps = [
    card.frontmatter.updated_at,
    card.frontmatter.created_at,
    ...card.events.map((event) => event.timestamp),
    ...card.comments.map((comment) => comment.created_at),
  ];
  return newestTimestamp(timestamps) ?? card.frontmatter.updated_at;
}

function referenceTimestamp(cards: CardRecord[]): string {
  const latest = newestTimestamp(cards.map((card) => latestActivity(card)));
  return latest ?? "1970-01-01T00:00:00Z";
}

function missingArtifactsForCurrentStatus(card: CardRecord, board: Board): string[] {
  const rule = board.done_rules[card.frontmatter.status];
  if (!rule) {
    return [];
  }
  const present = new Set(card.frontmatter.artifacts.map((artifact) => artifact.type));
  return rule.required_artifact_types.filter((artifactType) => !present.has(artifactType));
}

function cardLine(card: CardRecord, board: Board, ref: string): string {
  const assignees = card.frontmatter.assignees.length > 0 ? card.frontmatter.assignees.join(", ") : "none";
  const sittingWith = card.frontmatter.sitting_with ?? "nobody";
  const age = daysBetween(card.frontmatter.created_at, ref);
  const missing = missingArtifactsForCurrentStatus(card, board);
  const suffix = missing.length > 0 ? ` | missing: ${missing.join(", ")}` : "";
  return `- ${card.frontmatter.id} — ${displayCardTitle(card)} | priority ${card.frontmatter.priority} | owner ${card.frontmatter.owner} | assignees ${assignees} | sitting with ${sittingWith} | age ${age}d${suffix}`;
}

function compareCardsWithinColumn(left: CardRecord, right: CardRecord): number {
  const byOrder = left.frontmatter.column_order - right.frontmatter.column_order;
  if (byOrder !== 0) {
    return byOrder;
  }
  return compareCardIds(left.frontmatter.id, right.frontmatter.id);
}

function columnHeading(column: Board["columns"][number]): string {
  const headingLabel = column.emoji ? `${column.emoji} ${column.label}` : column.label;
  const lightBackgroundHex = column.light_background_hex?.toUpperCase() ?? null;
  const darkBackgroundHex = column.dark_background_hex?.toUpperCase() ?? null;
  if (!lightBackgroundHex && !darkBackgroundHex) {
    return `## ${headingLabel}`;
  }
  if (lightBackgroundHex && darkBackgroundHex && lightBackgroundHex === darkBackgroundHex) {
    return `## ${headingLabel} · background ${lightBackgroundHex}`;
  }

  const modeSegments = [
    lightBackgroundHex ? `light ${lightBackgroundHex}` : null,
    darkBackgroundHex ? `dark ${darkBackgroundHex}` : null,
  ].filter((segment): segment is string => segment !== null);
  return `## ${headingLabel} · ${modeSegments.join(" · ")}`;
}

function renderBoard(board: Board, cards: CardRecord[], ref: string): string {
  const heading = board.emoji ? `${board.emoji} ${board.name}` : board.name;
  const sections = board.columns.map((column) => {
    const columnCards = cards
      .filter((card) => card.frontmatter.board === board.id && card.frontmatter.status === column.id)
      .sort(compareCardsWithinColumn);
    const body = columnCards.length > 0 ? columnCards.map((card) => cardLine(card, board, ref)).join("\n") : "No cards.";
    return `${columnHeading(column)}\n\n${body}`;
  });
  return `# ${heading}\n\nGenerated from canonical card state.\n\n${sections.join("\n\n")}\n`;
}

function renderBlocked(cards: CardRecord[], boards: Map<string, Board>, ref: string): string {
  const blockedCards = cards.filter((card) => {
    if (card.frontmatter.status === "blocked") {
      return true;
    }
    return (card.frontmatter.sitting_reason ?? "").toLowerCase().includes("wait");
  });
  if (blockedCards.length === 0) {
    return "# Blocked Work\n\nNo blocked cards.\n";
  }
  const lines = blockedCards
    .sort((left, right) => compareCardIds(left.frontmatter.id, right.frontmatter.id))
    .map((card) => cardLine(card, boards.get(card.frontmatter.board)!, ref));
  return `# Blocked Work\n\n${lines.join("\n")}\n`;
}

function renderSittingWith(cards: CardRecord[], boards: Map<string, Board>, ref: string): string {
  const groups = new Map<string, CardRecord[]>();
  for (const card of cards) {
    const key = card.frontmatter.sitting_with ?? "unassigned";
    groups.set(key, [...(groups.get(key) ?? []), card]);
  }
  const sections = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([group, groupCards]) => {
      const body = groupCards
        .sort((left, right) => compareCardIds(left.frontmatter.id, right.frontmatter.id))
        .map((card) => cardLine(card, boards.get(card.frontmatter.board)!, ref))
        .join("\n");
      return `## ${group}\n\n${body}`;
    });
  return `# Sitting With\n\n${sections.join("\n\n")}\n`;
}

function renderRecentlyMoved(cards: CardRecord[]): string {
  const lines = cards
    .slice()
    .sort((left, right) => latestActivity(right).localeCompare(latestActivity(left)))
    .map((card) => {
      const latestEvent = card.events.at(-1);
      const latestSummary = latestEvent?.summary ?? "No events.";
      return `- ${card.frontmatter.id} — ${displayCardTitle(card)} | moved ${latestActivity(card)} | ${latestSummary}`;
    });
  return `# Recently Moved\n\n${lines.join("\n")}\n`;
}

function renderStale(cards: CardRecord[], thresholdDays: number, ref: string): string {
  const stale = cards.filter((card) => daysBetween(latestActivity(card), ref) >= thresholdDays);
  if (stale.length === 0) {
    return "# Stale Cards\n\nNo stale cards.\n";
  }
  const lines = stale
    .sort((left, right) => compareCardIds(left.frontmatter.id, right.frontmatter.id))
    .map((card) => `- ${card.frontmatter.id} — ${displayCardTitle(card)} | last moved ${latestActivity(card)}`);
  return `# Stale Cards\n\n${lines.join("\n")}\n`;
}

function renderShipped(cards: CardRecord[], ref: string): string {
  const shipped = cards.filter(
    (card) => card.frontmatter.status === "shipped" && daysBetween(latestActivity(card), ref) <= 7,
  );
  if (shipped.length === 0) {
    return "# Shipped This Week\n\nNo shipped cards.\n";
  }
  const lines = shipped
    .sort((left, right) => compareCardIds(left.frontmatter.id, right.frontmatter.id))
    .map((card) => `- ${card.frontmatter.id} — ${displayCardTitle(card)} | shipped ${latestActivity(card)}`);
  return `# Shipped This Week\n\n${lines.join("\n")}\n`;
}

function renderByOwner(cards: CardRecord[], boards: Map<string, Board>, ref: string): string {
  const groups = new Map<string, CardRecord[]>();
  for (const card of cards) {
    groups.set(card.frontmatter.owner, [...(groups.get(card.frontmatter.owner) ?? []), card]);
  }
  const sections = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([owner, ownerCards]) => {
      const body = ownerCards
        .sort((left, right) => compareCardIds(left.frontmatter.id, right.frontmatter.id))
        .map((card) => cardLine(card, boards.get(card.frontmatter.board)!, ref))
        .join("\n");
      return `## ${owner}\n\n${body}`;
    });
  return `# By Owner\n\n${sections.join("\n\n")}\n`;
}

export async function renderAll(root: string, options: { staleDays?: number } = {}): Promise<string[]> {
  const boards = await loadBoards(root);
  const cards = await loadCards(root);
  const ref = referenceTimestamp(cards);
  const viewsDir = path.join(root, "kanban", "views");
  await mkdir(viewsDir, { recursive: true });
  const boardsById = new Map(boards.map((board) => [board.id, board]));
  const outputs = new Map<string, string>();

  for (const board of boards) {
    outputs.set(`${board.id}.md`, renderBoard(board, cards, ref));
  }
  outputs.set("blocked.md", renderBlocked(cards, boardsById, ref));
  outputs.set("sitting-with.md", renderSittingWith(cards, boardsById, ref));
  outputs.set("recently-moved.md", renderRecentlyMoved(cards));
  outputs.set("stale-cards.md", renderStale(cards, options.staleDays ?? 5, ref));
  outputs.set("shipped-this-week.md", renderShipped(cards, ref));
  outputs.set("by-owner.md", renderByOwner(cards, boardsById, ref));

  const writtenPaths: string[] = [];
  for (const [fileName, body] of outputs.entries()) {
    const outputPath = path.join(viewsDir, fileName);
    await writeFile(outputPath, body, "utf8");
    writtenPaths.push(outputPath);
  }
  return writtenPaths.sort();
}
