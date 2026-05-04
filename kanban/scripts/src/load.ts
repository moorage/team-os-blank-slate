import { readFile } from "node:fs/promises";
import path from "node:path";

import fg from "fast-glob";
import matter from "gray-matter";
import { parse as parseYaml } from "yaml";
import { ZodError } from "zod";

import { compareIsoTimestamps } from "./dates.js";
import {
  BoardSchema,
  CardFrontmatterSchema,
  CommentFrontmatterSchema,
  EventSchema,
  FeatureIndexSchema,
  type Board,
  type CardRecord,
  type CommentRecord,
  type EventRecord,
  type FeatureIndex,
  type LoadIssue,
} from "./schemas.js";

const BOARD_GLOB = "kanban/boards/*.board.yaml";
const CARD_GLOB = "kanban/cards/*/card.md";

function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function parseBoardFile(filePath: string): Promise<Board> {
  const text = await readFile(filePath, "utf8");
  return BoardSchema.parse(parseYaml(text));
}

async function parseEventFile(filePath: string): Promise<EventRecord> {
  const text = await readFile(filePath, "utf8");
  const parsed = EventSchema.parse(parseYaml(text));
  return { ...parsed, path: filePath };
}

async function parseCommentFile(filePath: string): Promise<CommentRecord> {
  const text = await readFile(filePath, "utf8");
  const parsed = matter(text);
  const frontmatter = CommentFrontmatterSchema.parse(parsed.data);
  return { ...frontmatter, body: parsed.content.trim(), path: filePath };
}

async function loadCardFromPath(cardPath: string): Promise<CardRecord> {
  const text = await readFile(cardPath, "utf8");
  const parsed = matter(text);
  const frontmatter = CardFrontmatterSchema.parse(parsed.data);
  const dir = path.dirname(cardPath);
  const events = await loadEvents(dir);
  const comments = await loadComments(dir);
  return {
    body: parsed.content.trim(),
    comments,
    dir,
    events,
    frontmatter,
    path: cardPath,
  };
}

export async function loadBoards(root: string): Promise<Board[]> {
  const files = await fg(BOARD_GLOB, { cwd: root, absolute: true });
  const boards = await Promise.all(files.map((file) => parseBoardFile(file)));
  return boards.sort((left, right) => left.id.localeCompare(right.id));
}

export async function loadEvents(cardDir: string): Promise<EventRecord[]> {
  const files = await fg("events/*.yaml", { cwd: cardDir, absolute: true });
  const events = await Promise.all(files.map((file) => parseEventFile(file)));
  return events.sort((left, right) => {
    const byTime = compareIsoTimestamps(left.timestamp, right.timestamp);
    return byTime === 0 ? left.path.localeCompare(right.path) : byTime;
  });
}

export async function loadComments(cardDir: string): Promise<CommentRecord[]> {
  const files = await fg("comments/*.md", { cwd: cardDir, absolute: true });
  const comments = await Promise.all(files.map((file) => parseCommentFile(file)));
  return comments.sort((left, right) => {
    const byTime = compareIsoTimestamps(left.created_at, right.created_at);
    return byTime === 0 ? left.path.localeCompare(right.path) : byTime;
  });
}

export async function loadCard(cardDir: string): Promise<CardRecord> {
  return loadCardFromPath(path.join(cardDir, "card.md"));
}

export async function loadCards(root: string): Promise<CardRecord[]> {
  const files = await fg(CARD_GLOB, { cwd: root, absolute: true });
  const cards = await Promise.all(files.map((file) => loadCardFromPath(file)));
  return cards.sort((left, right) => left.frontmatter.id.localeCompare(right.frontmatter.id, "en", { numeric: true }));
}

export async function loadFeatureIndex(root: string): Promise<FeatureIndex> {
  const filePath = path.join(root, "product-development", "feature-index.yaml");
  const text = await readFile(filePath, "utf8");
  return FeatureIndexSchema.parse(parseYaml(text));
}

export async function loadRepositorySafely(root: string): Promise<{
  boards: Board[];
  cards: CardRecord[];
  featureIndex: FeatureIndex;
  issues: LoadIssue[];
}> {
  const issues: LoadIssue[] = [];
  const boards: Board[] = [];
  const cards: CardRecord[] = [];
  let featureIndex: FeatureIndex = { entries: [] };

  const boardFiles = await fg(BOARD_GLOB, { cwd: root, absolute: true });
  for (const boardFile of boardFiles) {
    try {
      boards.push(await parseBoardFile(boardFile));
    } catch (error) {
      issues.push({ kind: "board", message: formatError(error), path: boardFile });
    }
  }

  try {
    featureIndex = await loadFeatureIndex(root);
  } catch (error) {
    issues.push({
      kind: "feature-index",
      message: formatError(error),
      path: path.join(root, "product-development", "feature-index.yaml"),
    });
  }

  const cardFiles = await fg(CARD_GLOB, { cwd: root, absolute: true });
  for (const cardFile of cardFiles) {
    try {
      const text = await readFile(cardFile, "utf8");
      const parsed = matter(text);
      const frontmatter = CardFrontmatterSchema.parse(parsed.data);
      const dir = path.dirname(cardFile);
      const events: EventRecord[] = [];
      const comments: CommentRecord[] = [];

      const eventFiles = await fg("events/*.yaml", { cwd: dir, absolute: true });
      for (const eventFile of eventFiles) {
        try {
          events.push(await parseEventFile(eventFile));
        } catch (error) {
          issues.push({ kind: "event", message: formatError(error), path: eventFile });
        }
      }
      events.sort((left, right) => {
        const byTime = compareIsoTimestamps(left.timestamp, right.timestamp);
        return byTime === 0 ? left.path.localeCompare(right.path) : byTime;
      });

      const commentFiles = await fg("comments/*.md", { cwd: dir, absolute: true });
      for (const commentFile of commentFiles) {
        try {
          comments.push(await parseCommentFile(commentFile));
        } catch (error) {
          issues.push({ kind: "comment", message: formatError(error), path: commentFile });
        }
      }
      comments.sort((left, right) => {
        const byTime = compareIsoTimestamps(left.created_at, right.created_at);
        return byTime === 0 ? left.path.localeCompare(right.path) : byTime;
      });

      cards.push({
        body: parsed.content.trim(),
        comments,
        dir,
        events,
        frontmatter,
        path: cardFile,
      });
    } catch (error) {
      issues.push({ kind: "card", message: formatError(error), path: cardFile });
    }
  }

  cards.sort((left, right) => left.frontmatter.id.localeCompare(right.frontmatter.id, "en", { numeric: true }));
  boards.sort((left, right) => left.id.localeCompare(right.id));

  return { boards, cards, featureIndex, issues };
}
