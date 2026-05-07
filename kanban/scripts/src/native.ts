import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import fg from "fast-glob";
import matter from "gray-matter";
import { stringify as stringifyYaml } from "yaml";
import { z } from "zod";

import { normalizeIsoTimestamp } from "./dates.js";
import { compareCardIds, normalizeCardId } from "./ids.js";
import { loadBoards, loadCards, loadTeamDirectoryIndex, loadTeamDirectoryRecords } from "./load.js";
import { renderAll } from "./render.js";
import {
  CardTypeSchema,
  HexColorSchema,
  OptionalEmojiSchema,
  PrioritySchema,
  type Board,
  type CardRecord,
  type CommentRecord,
  type EventRecord,
  type TeamDirectoryRecord,
} from "./schemas.js";
import { collectValidationIssues, validateRepository } from "./validate.js";

const VALIDATION_REPORT_PATH = "kanban/views/validation-errors.md";
const RELEVANT_FILE_GLOBS = [
  "kanban/boards/*.board.yaml",
  "kanban/cards/**/*.md",
  "kanban/cards/**/*.yaml",
  "kanban/views/*.md",
  "product-development/feature-index.yaml",
  "team/people/index.yaml",
  "team/people/*.yaml",
];
const CardIDSchema = z.string().regex(/^KAN-\d{4}-\d{4}$/);
const StatusNameSchema = z.string().trim().regex(/^[a-z0-9-]+$/);
const NonEmptyStringSchema = z.string().trim().min(1);
const OptionalHexColorSchema = HexColorSchema.nullish().transform((value) => value ?? null);
const OptionalIsoTimestampSchema = z
  .preprocess(normalizeIsoTimestamp, z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/))
  .optional();

const MoveCardMutationSchema = z.object({
  type: z.literal("move-card"),
  actor: NonEmptyStringSchema.default("native-app"),
  board_id: StatusNameSchema,
  card_id: CardIDSchema,
  column_id: StatusNameSchema,
  destination_index: z.number().int().min(0),
  timestamp: OptionalIsoTimestampSchema,
});

const CreateCardMutationSchema = z.object({
  type: z.literal("create-card"),
  actor: NonEmptyStringSchema.default("native-app"),
  board_id: StatusNameSchema,
  card_type: CardTypeSchema,
  emoji: OptionalEmojiSchema,
  owner: NonEmptyStringSchema,
  priority: PrioritySchema,
  summary: NonEmptyStringSchema,
  timestamp: OptionalIsoTimestampSchema,
  title: NonEmptyStringSchema,
});

const SetCardEmojiMutationSchema = z.object({
  type: z.literal("set-card-emoji"),
  actor: NonEmptyStringSchema.default("native-app"),
  card_id: CardIDSchema,
  emoji: OptionalEmojiSchema,
  timestamp: OptionalIsoTimestampSchema,
});

const SetCardTitleMutationSchema = z.object({
  type: z.literal("set-card-title"),
  actor: NonEmptyStringSchema.default("native-app"),
  card_id: CardIDSchema,
  title: NonEmptyStringSchema,
  timestamp: OptionalIsoTimestampSchema,
});

const SetCardSummaryMutationSchema = z.object({
  type: z.literal("set-card-summary"),
  actor: NonEmptyStringSchema.default("native-app"),
  card_id: CardIDSchema,
  summary: NonEmptyStringSchema,
  timestamp: OptionalIsoTimestampSchema,
});

const SetCardOwnerMutationSchema = z.object({
  type: z.literal("set-card-owner"),
  actor: NonEmptyStringSchema.default("native-app"),
  card_id: CardIDSchema,
  owner: NonEmptyStringSchema,
  timestamp: OptionalIsoTimestampSchema,
});

const SetSittingWithMutationSchema = z.object({
  type: z.literal("set-sitting-with"),
  actor: NonEmptyStringSchema.default("native-app"),
  card_id: CardIDSchema,
  sitting_with: NonEmptyStringSchema,
  timestamp: OptionalIsoTimestampSchema,
});

const AddCommentMutationSchema = z.object({
  type: z.literal("add-comment"),
  author: NonEmptyStringSchema,
  body: NonEmptyStringSchema,
  card_id: CardIDSchema,
  role: NonEmptyStringSchema,
  timestamp: OptionalIsoTimestampSchema,
});

const SetColumnThemeMutationSchema = z.object({
  type: z.literal("set-column-theme"),
  board_id: StatusNameSchema,
  column_id: StatusNameSchema,
  dark_background_hex: OptionalHexColorSchema,
  light_background_hex: OptionalHexColorSchema,
});

const SetColumnEmojiMutationSchema = z.object({
  type: z.literal("set-column-emoji"),
  board_id: StatusNameSchema,
  column_id: StatusNameSchema,
  emoji: OptionalEmojiSchema,
});

const SetBoardEmojiMutationSchema = z.object({
  type: z.literal("set-board-emoji"),
  board_id: StatusNameSchema,
  emoji: OptionalEmojiSchema,
});

const AddBoardColumnMutationSchema = z.object({
  type: z.literal("add-board-column"),
  board_id: StatusNameSchema,
  column_id: StatusNameSchema,
  label: NonEmptyStringSchema,
  wip_limit: z.number().int().positive().optional(),
});

const SetTeamDirectoryRecordMutationSchema = z.object({
  type: z.literal("set-team-directory-record"),
  record_id: NonEmptyStringSchema,
  display_name: NonEmptyStringSchema,
  status: z.string().trim().nullish().transform((value) => value && value.length > 0 ? value : null),
  summary: z.string().trim().nullish().transform((value) => value && value.length > 0 ? value : null),
  emoji: OptionalEmojiSchema,
  profile_image_url: z.string().trim().nullish().transform((value) => value && value.length > 0 ? value : null),
  handles: z.record(z.string(), NonEmptyStringSchema).default({}),
  references: z.array(NonEmptyStringSchema).default([]),
});

const CreateTeamDirectoryRecordMutationSchema = z.object({
  type: z.literal("create-team-directory-record"),
  record_id: NonEmptyStringSchema,
  kind: z.enum(["person", "functional-alias"]),
  display_name: NonEmptyStringSchema,
  status: z.string().trim().nullish().transform((value) => value && value.length > 0 ? value : null),
  summary: z.string().trim().nullish().transform((value) => value && value.length > 0 ? value : null),
  emoji: OptionalEmojiSchema,
  profile_image_url: z.string().trim().nullish().transform((value) => value && value.length > 0 ? value : null),
  handles: z.record(z.string(), NonEmptyStringSchema).default({}),
  references: z.array(NonEmptyStringSchema).default([]),
});

const NativeMutationInputSchema = z.discriminatedUnion("type", [
  MoveCardMutationSchema,
  CreateCardMutationSchema,
  SetCardEmojiMutationSchema,
  SetCardTitleMutationSchema,
  SetCardSummaryMutationSchema,
  SetCardOwnerMutationSchema,
  SetSittingWithMutationSchema,
  AddCommentMutationSchema,
  SetColumnThemeMutationSchema,
  SetColumnEmojiMutationSchema,
  SetBoardEmojiMutationSchema,
  AddBoardColumnMutationSchema,
  SetTeamDirectoryRecordMutationSchema,
  CreateTeamDirectoryRecordMutationSchema,
]);

type NativeMutationInput = z.infer<typeof NativeMutationInputSchema>;
type NativeMutationOutcome = {
  cardID: string | null;
  operation: NativeMutationInput["type"];
};
type FileSnapshot = Map<string, string>;

export type NativeSnapshot = {
  boards: Array<{
    card_types: string[];
    columns: Array<{
      emoji: string | null;
      dark_background_hex: string | null;
      id: string;
      label: string;
      light_background_hex: string | null;
      wip_limit: number | null;
    }>;
    done_rules: Record<
      string,
      {
        required_artifact_types: string[];
      }
    >;
    emoji: string | null;
    id: string;
    name: string;
  }>;
  cards: Array<{
    artifacts: CardRecord["frontmatter"]["artifacts"];
    assignees: string[];
    board: string;
    collaborators: string[];
    column_order: number;
    created_at: string;
    emoji: string | null;
    feature_index_key: string | null;
    id: string;
    owner: string;
    priority: string;
    reviewers: string[];
    severity: string | null;
    sitting_expected_action: string | null;
    sitting_reason: string | null;
    sitting_since: string | null;
    sitting_with: string | null;
    status: string;
    summary: string;
    title: string;
    type: string;
    updated_at: string;
    watchers: string[];
  }>;
  comments_by_card_id: Record<
    string,
    Array<{
      author: string;
      body: string;
      card_id: string;
      created_at: string;
      role: string;
    }>
  >;
  directory_entries: Array<{
    display_name: string;
    emoji: string | null;
    github_handle: string | null;
    handles: Record<string, string>;
    id: string;
    kind: string;
    path: string;
    profile_image_url: string | null;
    references: string[];
    status: string | null;
    summary: string | null;
  }>;
  validation_outcome: {
    errors: string[];
    report_path: string;
  };
};

export type NativeMutationResult = {
  card_id: string | null;
  changed_files: Array<{
    contents: string | null;
    mode: "delete" | "upsert";
    path: string;
  }>;
  operation: NativeMutationInput["type"];
  snapshot: NativeSnapshot;
};

export async function exportNativeSnapshot(root: string): Promise<NativeSnapshot> {
  const [boards, cards, directoryIndex, directoryEntries, validationIssues] = await Promise.all([
    loadBoards(root),
    loadCards(root),
    loadTeamDirectoryIndex(root),
    loadTeamDirectoryRecords(root),
    collectValidationIssues(root),
  ]);
  const directoryPathsByID = new Map(directoryIndex.entries.map((entry) => [entry.key, entry.path]));

  const commentsByCardID = Object.fromEntries(
    cards.map((card) => [
      card.frontmatter.id,
      card.comments.map((comment) => ({
        author: comment.author,
        body: comment.body,
        card_id: comment.card_id,
        created_at: comment.created_at,
        role: comment.role,
      })),
    ]),
  );

  return {
    boards: boards.map((board) => ({
      card_types: board.card_types,
      columns: board.columns.map((column) => ({
        emoji: column.emoji,
        dark_background_hex: column.dark_background_hex,
        id: column.id,
        label: column.label,
        light_background_hex: column.light_background_hex,
        wip_limit: column.wip_limit ?? null,
      })),
      done_rules: Object.fromEntries(
        Object.entries(board.done_rules).map(([statusID, rule]) => [
          statusID,
          {
            required_artifact_types: rule.required_artifact_types,
          },
        ]),
      ),
      emoji: board.emoji,
      id: board.id,
      name: board.name,
    })),
    cards: cards.map((card) => ({
      artifacts: card.frontmatter.artifacts,
      assignees: card.frontmatter.assignees,
      board: card.frontmatter.board,
      collaborators: card.frontmatter.collaborators,
      column_order: card.frontmatter.column_order,
      created_at: card.frontmatter.created_at,
      emoji: card.frontmatter.emoji,
      feature_index_key: card.frontmatter.feature_index_key,
      id: card.frontmatter.id,
      owner: card.frontmatter.owner,
      priority: card.frontmatter.priority,
      reviewers: card.frontmatter.reviewers,
      severity: card.frontmatter.severity,
      sitting_expected_action: card.frontmatter.sitting_expected_action,
      sitting_reason: card.frontmatter.sitting_reason,
      sitting_since: card.frontmatter.sitting_since,
      sitting_with: card.frontmatter.sitting_with,
      status: card.frontmatter.status,
      summary: card.frontmatter.summary,
      title: card.frontmatter.title,
      type: card.frontmatter.type,
      updated_at: card.frontmatter.updated_at,
      watchers: card.frontmatter.watchers,
    })),
    comments_by_card_id: commentsByCardID,
    directory_entries: directoryEntries.map((entry) => ({
      display_name: entry.display_name,
      emoji: entry.emoji,
      github_handle: entry.handles.github ?? null,
      handles: entry.handles,
      id: entry.id,
      kind: entry.kind,
      path: directoryPathsByID.get(entry.id) ?? `team/people/${entry.id}.yaml`,
      profile_image_url: entry.profile_image_url,
      references: entry.references,
      status: entry.status,
      summary: entry.summary,
    })),
    validation_outcome: {
      errors: validationIssues.map((issue) => `[${issue.code}] ${issue.path}: ${issue.message}`),
      report_path: VALIDATION_REPORT_PATH,
    },
  };
}

export async function applyNativeMutation(root: string, input: unknown): Promise<NativeMutationResult> {
  const mutation = NativeMutationInputSchema.parse(input);
  const before = await captureRelevantFiles(root);

  try {
    const outcome = await applyMutation(root, mutation);
    await validateRepository(root);
    await renderAll(root);

    const after = await captureRelevantFiles(root);
    return {
      card_id: outcome.cardID,
      changed_files: diffRelevantFiles(before, after),
      operation: outcome.operation,
      snapshot: await exportNativeSnapshot(root),
    };
  } catch (error) {
    await restoreRelevantFiles(root, before);
    throw error;
  }
}

async function applyMutation(root: string, mutation: NativeMutationInput): Promise<NativeMutationOutcome> {
  switch (mutation.type) {
    case "move-card":
      return moveCard(root, mutation);
    case "create-card":
      return createCard(root, mutation);
    case "set-card-emoji":
      return setCardEmoji(root, mutation);
    case "set-card-title":
      return setCardTitle(root, mutation);
    case "set-card-summary":
      return setCardSummary(root, mutation);
    case "set-card-owner":
      return setCardOwner(root, mutation);
    case "set-sitting-with":
      return setSittingWith(root, mutation);
    case "add-comment":
      return addComment(root, mutation);
    case "set-column-theme":
      return setColumnTheme(root, mutation);
    case "set-column-emoji":
      return setColumnEmoji(root, mutation);
    case "set-board-emoji":
      return setBoardEmoji(root, mutation);
    case "add-board-column":
      return addBoardColumn(root, mutation);
    case "set-team-directory-record":
      return setTeamDirectoryRecord(root, mutation);
    case "create-team-directory-record":
      return createTeamDirectoryRecord(root, mutation);
  }
}

async function moveCard(root: string, mutation: z.infer<typeof MoveCardMutationSchema>): Promise<NativeMutationOutcome> {
  const timestamp = resolveTimestamp(mutation.timestamp);
  const [boards, cards] = await Promise.all([loadBoards(root), loadCards(root)]);
  const board = requireBoard(boards, mutation.board_id);
  const card = requireCard(cards, mutation.card_id);
  if (card.frontmatter.board !== board.id) {
    throw new Error(`Card ${card.frontmatter.id} belongs to board ${card.frontmatter.board}, not ${board.id}.`);
  }
  requireColumn(board, mutation.column_id);

  const sourceColumnID = card.frontmatter.status;
  const destinationBaseCards = orderedCards(
    cards,
    board.id,
    mutation.column_id,
    mutation.card_id,
    sourceColumnID === mutation.column_id,
  );
  const clampedIndex = Math.min(mutation.destination_index, destinationBaseCards.length);
  const destinationCardIDs = destinationBaseCards.map((record) => record.frontmatter.id);
  destinationCardIDs.splice(clampedIndex, 0, mutation.card_id);

  const currentDestinationIDs = orderedCards(cards, board.id, mutation.column_id).map((record) => record.frontmatter.id);
  if (sourceColumnID === mutation.column_id && arraysEqual(currentDestinationIDs, destinationCardIDs)) {
    return { cardID: mutation.card_id, operation: mutation.type };
  }

  const sourceCards = orderedCards(cards, board.id, sourceColumnID).filter(
    (record) => record.frontmatter.id !== mutation.card_id,
  );
  const sourceOrderByCardID = new Map(sourceCards.map((record, index) => [record.frontmatter.id, index + 1]));
  const destinationOrderByCardID = new Map(destinationCardIDs.map((cardID, index) => [cardID, index + 1]));

  const changedCards = cards.map((record) => {
    if (record.frontmatter.id === mutation.card_id) {
      return updateCardRecord(record, {
        column_order: destinationOrderByCardID.get(record.frontmatter.id) ?? record.frontmatter.column_order,
        status: mutation.column_id,
        updated_at: timestamp,
      });
    }
    if (sourceColumnID !== mutation.column_id) {
      if (record.frontmatter.board === board.id && record.frontmatter.status === sourceColumnID) {
        const nextOrder = sourceOrderByCardID.get(record.frontmatter.id);
        if (nextOrder !== undefined) {
          return updateCardRecord(record, {
            column_order: nextOrder,
            updated_at: timestamp,
          });
        }
      }
      if (record.frontmatter.board === board.id && record.frontmatter.status === mutation.column_id) {
        const nextOrder = destinationOrderByCardID.get(record.frontmatter.id);
        if (nextOrder !== undefined) {
          return updateCardRecord(record, {
            column_order: nextOrder,
            updated_at: timestamp,
          });
        }
      }
      return record;
    }
    if (record.frontmatter.board === board.id && record.frontmatter.status === mutation.column_id) {
      const nextOrder = destinationOrderByCardID.get(record.frontmatter.id);
      if (nextOrder !== undefined) {
        return updateCardRecord(record, {
          column_order: nextOrder,
          updated_at: timestamp,
        });
      }
    }
    return record;
  });

  const changedRecords = changedCards.filter((record, index) => !cardRecordEquals(record, cards[index]!));
  for (const record of changedRecords) {
    await writeCardRecord(record);
  }

  if (sourceColumnID !== mutation.column_id) {
    const eventPath = path.join(
      root,
      "kanban",
      "cards",
      mutation.card_id,
      "events",
      `${fileSafeTimestamp(timestamp)}-status-changed.yaml`,
    );
    const eventContents = serializeEventRecord({
      actor: mutation.actor,
      card_id: mutation.card_id,
      from_status: sourceColumnID,
      status: mutation.column_id,
      summary: `Moved from ${sourceColumnID} to ${mutation.column_id} from the native Team OS app.`,
      timestamp,
      type: "status-changed",
    });
    await writeRelativeFile(root, relativePath(root, eventPath), eventContents);
  }

  return { cardID: mutation.card_id, operation: mutation.type };
}

async function createCard(root: string, mutation: z.infer<typeof CreateCardMutationSchema>): Promise<NativeMutationOutcome> {
  const timestamp = resolveTimestamp(mutation.timestamp);
  const [boards, cards] = await Promise.all([loadBoards(root), loadCards(root)]);
  const board = requireBoard(boards, mutation.board_id);
  const initialColumn = board.columns.at(0);
  if (!initialColumn) {
    throw new Error(`Board ${board.id} has no columns.`);
  }
  if (!board.card_types.includes(mutation.card_type)) {
    throw new Error(`Board ${board.id} does not allow card type ${mutation.card_type}.`);
  }

  const cardID = nextCardID(cards, timestamp);
  const nextColumnOrder = orderedCards(cards, board.id, initialColumn.id).length + 1;
  const cardPath = path.join(root, "kanban", "cards", cardID, "card.md");
  const cardContents = serializeCardRecord({
    body: "## Why this card exists\n\n" + mutation.summary + "\n\n## Next move\n\nDefine the next move.\n",
    comments: [],
    dir: path.dirname(cardPath),
    events: [],
    frontmatter: {
      artifacts: [],
      assignees: [mutation.owner],
      board: board.id,
      collaborators: [],
      column_order: nextColumnOrder,
      created_at: timestamp,
      emoji: mutation.emoji,
      feature_index_key: null,
      id: cardID,
      owner: mutation.owner,
      priority: mutation.priority,
      reviewers: [],
      severity: mutation.card_type === "bug" || mutation.card_type === "incident" ? "medium" : null,
      sitting_expected_action: null,
      sitting_reason: null,
      sitting_since: null,
      sitting_with: null,
      status: initialColumn.id,
      summary: mutation.summary,
      title: mutation.title,
      type: mutation.card_type,
      updated_at: timestamp,
      watchers: [],
    },
    path: cardPath,
  });
  await writeRelativeFile(root, relativePath(root, cardPath), cardContents);

  const eventPath = path.join(root, "kanban", "cards", cardID, "events", `${fileSafeTimestamp(timestamp)}-created.yaml`);
  const eventContents = serializeEventRecord({
    actor: mutation.actor,
    board: board.id,
    card_id: cardID,
    status: initialColumn.id,
    summary: "Created from the native Team OS app.",
    timestamp,
    type: "created",
  });
  await writeRelativeFile(root, relativePath(root, eventPath), eventContents);
  return { cardID, operation: mutation.type };
}

async function setCardEmoji(
  root: string,
  mutation: z.infer<typeof SetCardEmojiMutationSchema>,
): Promise<NativeMutationOutcome> {
  const timestamp = resolveTimestamp(mutation.timestamp);
  const cards = await loadCards(root);
  const card = requireCard(cards, mutation.card_id);
  const updatedCard = updateCardRecord(card, {
    emoji: mutation.emoji,
    updated_at: timestamp,
  });
  await writeCardRecord(updatedCard);
  return { cardID: mutation.card_id, operation: mutation.type };
}

async function setCardTitle(
  root: string,
  mutation: z.infer<typeof SetCardTitleMutationSchema>,
): Promise<NativeMutationOutcome> {
  const timestamp = resolveTimestamp(mutation.timestamp);
  const cards = await loadCards(root);
  const card = requireCard(cards, mutation.card_id);
  if (card.frontmatter.title === mutation.title) {
    return { cardID: mutation.card_id, operation: mutation.type };
  }

  const updatedCard = updateCardRecord(card, {
    title: mutation.title,
    updated_at: timestamp,
  });
  await writeCardRecord(updatedCard);
  return { cardID: mutation.card_id, operation: mutation.type };
}

async function setCardSummary(
  root: string,
  mutation: z.infer<typeof SetCardSummaryMutationSchema>,
): Promise<NativeMutationOutcome> {
  const timestamp = resolveTimestamp(mutation.timestamp);
  const cards = await loadCards(root);
  const card = requireCard(cards, mutation.card_id);
  if (card.frontmatter.summary === mutation.summary) {
    return { cardID: mutation.card_id, operation: mutation.type };
  }

  const updatedCard = updateCardRecord(card, {
    summary: mutation.summary,
    updated_at: timestamp,
  });
  await writeCardRecord(updatedCard);
  return { cardID: mutation.card_id, operation: mutation.type };
}

async function setCardOwner(
  root: string,
  mutation: z.infer<typeof SetCardOwnerMutationSchema>,
): Promise<NativeMutationOutcome> {
  const timestamp = resolveTimestamp(mutation.timestamp);
  const cards = await loadCards(root);
  const card = requireCard(cards, mutation.card_id);
  if (card.frontmatter.owner === mutation.owner) {
    return { cardID: mutation.card_id, operation: mutation.type };
  }

  const updatedCard = updateCardRecord(card, {
    owner: mutation.owner,
    updated_at: timestamp,
  });
  await writeCardRecord(updatedCard);
  return { cardID: mutation.card_id, operation: mutation.type };
}

async function setSittingWith(
  root: string,
  mutation: z.infer<typeof SetSittingWithMutationSchema>,
): Promise<NativeMutationOutcome> {
  const timestamp = resolveTimestamp(mutation.timestamp);
  const cards = await loadCards(root);
  const card = requireCard(cards, mutation.card_id);
  if (card.frontmatter.sitting_with === mutation.sitting_with) {
    return { cardID: mutation.card_id, operation: mutation.type };
  }

  const updatedCard = updateCardRecord(card, {
    sitting_since: timestamp,
    sitting_with: mutation.sitting_with,
    updated_at: timestamp,
  });
  await writeCardRecord(updatedCard);

  const eventPath = path.join(
    root,
    "kanban",
    "cards",
    mutation.card_id,
    "events",
    `${fileSafeTimestamp(timestamp)}-sitting-with-changed.yaml`,
  );
  const eventContents = serializeEventRecord({
    actor: mutation.actor,
    card_id: mutation.card_id,
    from_sitting_with: card.frontmatter.sitting_with ?? undefined,
    sitting_expected_action: card.frontmatter.sitting_expected_action ?? undefined,
    sitting_reason: card.frontmatter.sitting_reason ?? undefined,
    sitting_since: timestamp,
    sitting_with: mutation.sitting_with,
    summary: `Handed the next action to ${mutation.sitting_with} from the native Team OS app.`,
    timestamp,
    type: "sitting-with-changed",
  });
  await writeRelativeFile(root, relativePath(root, eventPath), eventContents);

  return { cardID: mutation.card_id, operation: mutation.type };
}

async function addComment(root: string, mutation: z.infer<typeof AddCommentMutationSchema>): Promise<NativeMutationOutcome> {
  const timestamp = resolveTimestamp(mutation.timestamp);
  const cards = await loadCards(root);
  requireCard(cards, mutation.card_id);
  const commentPath = path.join(
    root,
    "kanban",
    "cards",
    mutation.card_id,
    "comments",
    `${fileSafeTimestamp(timestamp)}-${slugify(mutation.author)}.md`,
  );
  const commentContents = serializeCommentRecord({
    author: mutation.author,
    body: mutation.body,
    card_id: mutation.card_id,
    created_at: timestamp,
    path: commentPath,
    role: mutation.role,
  });
  await writeRelativeFile(root, relativePath(root, commentPath), commentContents);
  return { cardID: mutation.card_id, operation: mutation.type };
}

async function setColumnTheme(
  root: string,
  mutation: z.infer<typeof SetColumnThemeMutationSchema>,
): Promise<NativeMutationOutcome> {
  const boards = await loadBoards(root);
  const board = requireBoard(boards, mutation.board_id);
  const updatedBoard: Board = {
    ...board,
    columns: board.columns.map((column) => {
      if (column.id !== mutation.column_id) {
        return column;
      }
      return {
        ...column,
        dark_background_hex: mutation.dark_background_hex,
        light_background_hex: mutation.light_background_hex,
      };
    }),
  };
  requireColumn(updatedBoard, mutation.column_id);

  const boardPath = path.join(root, "kanban", "boards", `${board.id}.board.yaml`);
  await writeRelativeFile(root, relativePath(root, boardPath), serializeBoard(updatedBoard));
  return { cardID: null, operation: mutation.type };
}

async function setColumnEmoji(
  root: string,
  mutation: z.infer<typeof SetColumnEmojiMutationSchema>,
): Promise<NativeMutationOutcome> {
  const boards = await loadBoards(root);
  const board = requireBoard(boards, mutation.board_id);
  const updatedBoard: Board = {
    ...board,
    columns: board.columns.map((column) => {
      if (column.id !== mutation.column_id) {
        return column;
      }
      return {
        ...column,
        emoji: mutation.emoji,
      };
    }),
  };
  requireColumn(updatedBoard, mutation.column_id);

  const boardPath = path.join(root, "kanban", "boards", `${board.id}.board.yaml`);
  await writeRelativeFile(root, relativePath(root, boardPath), serializeBoard(updatedBoard));
  return { cardID: null, operation: mutation.type };
}

async function setBoardEmoji(
  root: string,
  mutation: z.infer<typeof SetBoardEmojiMutationSchema>,
): Promise<NativeMutationOutcome> {
  const boards = await loadBoards(root);
  const board = requireBoard(boards, mutation.board_id);
  const updatedBoard: Board = {
    ...board,
    emoji: mutation.emoji,
  };

  const boardPath = path.join(root, "kanban", "boards", `${board.id}.board.yaml`);
  await writeRelativeFile(root, relativePath(root, boardPath), serializeBoard(updatedBoard));
  return { cardID: null, operation: mutation.type };
}

async function addBoardColumn(
  root: string,
  mutation: z.infer<typeof AddBoardColumnMutationSchema>,
): Promise<NativeMutationOutcome> {
  const boards = await loadBoards(root);
  const board = requireBoard(boards, mutation.board_id);
  if (board.columns.some((column) => column.id === mutation.column_id)) {
    throw new Error(`Board ${board.id} already has a column with ID ${mutation.column_id}.`);
  }

  const updatedBoard: Board = {
    ...board,
    columns: [
      ...board.columns,
      {
        id: mutation.column_id,
        label: mutation.label,
        emoji: null,
        light_background_hex: null,
        dark_background_hex: null,
        ...(mutation.wip_limit ? { wip_limit: mutation.wip_limit } : {}),
      },
    ],
  };

  const boardPath = path.join(root, "kanban", "boards", `${board.id}.board.yaml`);
  await writeRelativeFile(root, relativePath(root, boardPath), serializeBoard(updatedBoard));
  return { cardID: null, operation: mutation.type };
}

async function setTeamDirectoryRecord(
  root: string,
  mutation: z.infer<typeof SetTeamDirectoryRecordMutationSchema>,
): Promise<NativeMutationOutcome> {
  const [directoryIndex, directoryRecords] = await Promise.all([
    loadTeamDirectoryIndex(root),
    loadTeamDirectoryRecords(root),
  ]);
  const record = requireTeamDirectoryRecord(directoryRecords, mutation.record_id);
  const indexEntry = directoryIndex.entries.find((entry) => entry.key === mutation.record_id);
  if (!indexEntry) {
    throw new Error(`Team directory record ${mutation.record_id} is missing from team/people/index.yaml.`);
  }

  const updatedRecord: TeamDirectoryRecord = {
    ...record,
    display_name: mutation.display_name,
    emoji: mutation.emoji,
    handles: mutation.handles,
    profile_image_url: mutation.profile_image_url,
    references: mutation.references,
    status: mutation.status,
    summary: mutation.summary,
  };

  if (serializeTeamDirectoryRecord(updatedRecord) === serializeTeamDirectoryRecord(record)) {
    return { cardID: null, operation: mutation.type };
  }

  await writeRelativeFile(root, indexEntry.path, serializeTeamDirectoryRecord(updatedRecord));
  return { cardID: null, operation: mutation.type };
}

async function createTeamDirectoryRecord(
  root: string,
  mutation: z.infer<typeof CreateTeamDirectoryRecordMutationSchema>,
): Promise<NativeMutationOutcome> {
  const [directoryIndex, directoryRecords] = await Promise.all([
    loadTeamDirectoryIndex(root),
    loadTeamDirectoryRecords(root),
  ]);

  if (directoryIndex.entries.some((entry) => entry.key === mutation.record_id) || directoryRecords.some((record) => record.id === mutation.record_id)) {
    throw new Error(`Team directory record ${mutation.record_id} already exists.`);
  }

  const recordPath = `team/people/${mutation.record_id}.yaml`;
  if (directoryIndex.entries.some((entry) => entry.path === recordPath)) {
    throw new Error(`Team directory path ${recordPath} is already registered in team/people/index.yaml.`);
  }

  const createdRecord: TeamDirectoryRecord = {
    id: mutation.record_id,
    kind: mutation.kind,
    display_name: mutation.display_name,
    status: mutation.status,
    summary: mutation.summary,
    emoji: mutation.emoji,
    profile_image_url: mutation.profile_image_url,
    handles: mutation.handles,
    references: mutation.references,
  };

  const updatedIndex = {
    entries: [
      ...directoryIndex.entries,
      {
        key: mutation.record_id,
        kind: mutation.kind,
        path: recordPath,
      },
    ].sort((left, right) => left.key.localeCompare(right.key)),
  };

  await Promise.all([
    writeRelativeFile(root, recordPath, serializeTeamDirectoryRecord(createdRecord)),
    writeRelativeFile(root, "team/people/index.yaml", serializeTeamDirectoryIndex(updatedIndex)),
  ]);
  return { cardID: null, operation: mutation.type };
}

async function captureRelevantFiles(root: string): Promise<FileSnapshot> {
  const files = await fg(RELEVANT_FILE_GLOBS, { cwd: root, onlyFiles: true });
  const snapshot = new Map<string, string>();
  await Promise.all(
    files.sort().map(async (filePath) => {
      snapshot.set(filePath, await readFile(path.join(root, filePath), "utf8"));
    }),
  );
  return snapshot;
}

async function restoreRelevantFiles(root: string, snapshot: FileSnapshot): Promise<void> {
  const currentFiles = await captureRelevantFiles(root);
  for (const currentPath of currentFiles.keys()) {
    if (!snapshot.has(currentPath)) {
      await rm(path.join(root, currentPath), { force: true });
    }
  }
  for (const [relativeFilePath, contents] of snapshot.entries()) {
    await writeRelativeFile(root, relativeFilePath, contents);
  }
}

function diffRelevantFiles(before: FileSnapshot, after: FileSnapshot): NativeMutationResult["changed_files"] {
  const paths = new Set([...before.keys(), ...after.keys()]);
  const changedFiles: NativeMutationResult["changed_files"] = [];
  for (const filePath of [...paths].sort()) {
    const previousContents = before.get(filePath);
    const nextContents = after.get(filePath);
    if (previousContents === nextContents) {
      continue;
    }
    if (nextContents === undefined) {
      changedFiles.push({ contents: null, mode: "delete", path: filePath });
      continue;
    }
    changedFiles.push({ contents: nextContents, mode: "upsert", path: filePath });
  }
  return changedFiles;
}

function serializeBoard(board: Board): string {
  return `${stringifyYaml({
    card_types: board.card_types,
    columns: board.columns.map((column) => ({
      ...(column.dark_background_hex ? { dark_background_hex: column.dark_background_hex } : {}),
      id: column.id,
      label: column.label,
      ...(column.emoji ? { emoji: column.emoji } : {}),
      ...(column.light_background_hex ? { light_background_hex: column.light_background_hex } : {}),
      ...(column.wip_limit ? { wip_limit: column.wip_limit } : {}),
    })),
    description: board.description,
    done_rules: board.done_rules,
    ...(board.emoji ? { emoji: board.emoji } : {}),
    id: board.id,
    name: board.name,
  })}`.trimEnd() + "\n";
}

function serializeCardRecord(card: CardRecord): string {
  const frontmatter = {
    artifacts: card.frontmatter.artifacts,
    assignees: card.frontmatter.assignees,
    board: card.frontmatter.board,
    collaborators: card.frontmatter.collaborators,
    column_order: card.frontmatter.column_order,
    created_at: card.frontmatter.created_at,
    emoji: card.frontmatter.emoji,
    feature_index_key: card.frontmatter.feature_index_key,
    id: card.frontmatter.id,
    owner: card.frontmatter.owner,
    priority: card.frontmatter.priority,
    reviewers: card.frontmatter.reviewers,
    severity: card.frontmatter.severity,
    sitting_expected_action: card.frontmatter.sitting_expected_action,
    sitting_reason: card.frontmatter.sitting_reason,
    sitting_since: card.frontmatter.sitting_since,
    sitting_with: card.frontmatter.sitting_with,
    status: card.frontmatter.status,
    summary: card.frontmatter.summary,
    title: card.frontmatter.title,
    type: card.frontmatter.type,
    updated_at: card.frontmatter.updated_at,
    watchers: card.frontmatter.watchers,
  };
  return matter.stringify(`${card.body.trim()}\n`, frontmatter).trimEnd() + "\n";
}

function serializeCommentRecord(comment: CommentRecord): string {
  return matter
    .stringify(`${comment.body.trim()}\n`, {
      author: comment.author,
      card_id: comment.card_id,
      created_at: comment.created_at,
      role: comment.role,
    })
    .trimEnd() + "\n";
}

function serializeEventRecord(event: Record<string, string | null | undefined>): string {
  const orderedEvent = Object.fromEntries(
    Object.entries(event).filter(([, value]) => value !== undefined),
  );
  return `${stringifyYaml(orderedEvent)}`.trimEnd() + "\n";
}

function serializeTeamDirectoryRecord(record: TeamDirectoryRecord): string {
  return `${stringifyYaml({
    id: record.id,
    kind: record.kind,
    display_name: record.display_name,
    ...(record.status ? { status: record.status } : {}),
    ...(record.summary ? { summary: record.summary } : {}),
    ...(record.emoji ? { emoji: record.emoji } : {}),
    ...(record.profile_image_url ? { profile_image_url: record.profile_image_url } : {}),
    handles: record.handles,
    references: record.references,
  })}`.trimEnd() + "\n";
}

function serializeTeamDirectoryIndex(index: { entries: Array<{ key: string; kind: string; path: string }> }): string {
  return `${stringifyYaml({
    entries: index.entries.map((entry) => ({
      key: entry.key,
      kind: entry.kind,
      path: entry.path,
    })),
  })}`.trimEnd() + "\n";
}

async function writeCardRecord(card: CardRecord): Promise<void> {
  await writeFile(card.path, serializeCardRecord(card), "utf8");
}

async function writeRelativeFile(root: string, relativeFilePath: string, contents: string): Promise<void> {
  const targetPath = path.join(root, relativeFilePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, contents, "utf8");
}

function updateCardRecord(
  card: CardRecord,
  updates: Partial<CardRecord["frontmatter"]>,
): CardRecord {
  return {
    ...card,
    frontmatter: {
      ...card.frontmatter,
      ...updates,
    },
  };
}

function requireBoard(boards: Board[], boardID: string): Board {
  const board = boards.find((candidate) => candidate.id === boardID);
  if (!board) {
    throw new Error(`Board ${boardID} does not exist.`);
  }
  return board;
}

function requireColumn(board: Board, columnID: string): Board["columns"][number] {
  const column = board.columns.find((candidate) => candidate.id === columnID);
  if (!column) {
    throw new Error(`Column ${columnID} does not exist on board ${board.id}.`);
  }
  return column;
}

function requireCard(cards: CardRecord[], cardID: string): CardRecord {
  const normalizedCardID = normalizeCardId(cardID);
  const card = cards.find((candidate) => candidate.frontmatter.id === normalizedCardID);
  if (!card) {
    throw new Error(`Card ${normalizedCardID} does not exist.`);
  }
  return card;
}

function requireTeamDirectoryRecord(records: TeamDirectoryRecord[], recordID: string): TeamDirectoryRecord {
  const record = records.find((candidate) => candidate.id === recordID);
  if (!record) {
    throw new Error(`Team directory record ${recordID} does not exist.`);
  }
  return record;
}

function orderedCards(
  cards: CardRecord[],
  boardID: string,
  columnID: string,
  excludedCardID?: string,
  excludeCard = false,
): CardRecord[] {
  return cards
    .filter((record) => {
      if (record.frontmatter.board !== boardID || record.frontmatter.status !== columnID) {
        return false;
      }
      if (excludeCard && record.frontmatter.id === excludedCardID) {
        return false;
      }
      return true;
    })
    .sort((left, right) => {
      const byOrder = left.frontmatter.column_order - right.frontmatter.column_order;
      if (byOrder !== 0) {
        return byOrder;
      }
      return compareCardIds(left.frontmatter.id, right.frontmatter.id);
    });
}

function cardRecordEquals(left: CardRecord, right: CardRecord): boolean {
  return JSON.stringify(left.frontmatter) === JSON.stringify(right.frontmatter) && left.body === right.body;
}

function nextCardID(cards: CardRecord[], timestamp: string): string {
  const year = new Date(timestamp).getUTCFullYear();
  const maxSequence = cards.reduce((currentMax, card) => {
    const match = /^KAN-(\d{4})-(\d{4})$/.exec(card.frontmatter.id);
    if (!match) {
      return currentMax;
    }
    if (Number(match[1]) !== year) {
      return currentMax;
    }
    return Math.max(currentMax, Number(match[2]));
  }, 0);
  return `KAN-${year}-${String(maxSequence + 1).padStart(4, "0")}`;
}

function resolveTimestamp(timestampOverride?: string): string {
  // Keep fractional seconds so rapid native mutations do not overwrite the
  // same append-only event or comment file within a single second.
  return timestampOverride ?? new Date().toISOString();
}

function fileSafeTimestamp(timestamp: string): string {
  return timestamp.replaceAll(":", "-");
}

function slugify(value: string): string {
  const lowered = value.trim().toLowerCase();
  const components = lowered.split(/[^a-z0-9]+/).filter(Boolean);
  return components.join("-") || "unknown";
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function relativePath(root: string, target: string): string {
  return path.relative(root, target).replaceAll(path.sep, "/");
}
