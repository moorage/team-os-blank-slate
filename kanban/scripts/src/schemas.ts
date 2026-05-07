import { z } from "zod";

import { isIsoTimestamp, normalizeIsoTimestamp } from "./dates.js";

const NonEmptyStringSchema = z.string().trim().min(1);
const NullableStringSchema = z.string().trim().min(1).nullish().transform((value) => value ?? null);
const StringListSchema = z.array(NonEmptyStringSchema).default([]);
const StatusNameSchema = z.string().trim().regex(/^[a-z0-9-]+$/);
export const HexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a hex color like #D97706.");
const EmojiGraphemeSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const IsoTimestampSchema = z.preprocess(
  normalizeIsoTimestamp,
  z.string().refine(isIsoTimestamp, "Expected an ISO timestamp like 2026-05-04T10:18:00Z."),
);

function isSingleEmojiGrapheme(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const graphemes = [...EmojiGraphemeSegmenter.segment(trimmed)];
  return graphemes.length === 1 && /\p{Extended_Pictographic}/u.test(trimmed);
}

export const EmojiSchema = z
  .string()
  .trim()
  .refine(isSingleEmojiGrapheme, "Expected a single emoji grapheme such as ✨ or 🐛.")
;
export const OptionalEmojiSchema = EmojiSchema.nullish().transform((value) => value ?? null);

export const CardTypeSchema = z.enum(["feature", "bug", "experiment", "incident"]);
export const PrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const SeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const ArtifactTypeSchema = z.enum([
  "analytics",
  "bug-investigation",
  "customer-evidence",
  "engineering-plan",
  "feature-index",
  "launch-readiness",
  "post-launch-review",
  "prd",
]);
export const EventTypeSchema = z.enum([
  "created",
  "status-changed",
  "sitting-with-changed",
  "blocked",
  "unblocked",
  "artifact-linked",
]);

export const ArtifactLinkSchema = z.object({
  type: ArtifactTypeSchema,
  label: NonEmptyStringSchema,
  path: NonEmptyStringSchema,
});

export const CardFrontmatterSchema = z.object({
  id: z.string().regex(/^KAN-\d{4}-\d{4}$/),
  title: NonEmptyStringSchema,
  emoji: OptionalEmojiSchema,
  type: CardTypeSchema,
  board: StatusNameSchema,
  status: StatusNameSchema,
  column_order: z.number().int().positive(),
  priority: PrioritySchema,
  severity: SeveritySchema.nullish().transform((value) => value ?? null),
  owner: NonEmptyStringSchema,
  assignees: StringListSchema,
  reviewers: StringListSchema,
  watchers: StringListSchema,
  collaborators: StringListSchema,
  sitting_with: NullableStringSchema,
  sitting_reason: NullableStringSchema,
  sitting_since: IsoTimestampSchema.nullish().transform((value) => value ?? null),
  sitting_expected_action: NullableStringSchema,
  created_at: IsoTimestampSchema,
  updated_at: IsoTimestampSchema,
  summary: NonEmptyStringSchema,
  feature_index_key: NullableStringSchema,
  artifacts: z.array(ArtifactLinkSchema).default([]),
});

export const BoardColumnSchema = z.preprocess((value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }

  const candidate = value as Record<string, unknown>;
  const legacyBackgroundHex = candidate.background_hex;
  return {
    ...candidate,
    light_background_hex: candidate.light_background_hex ?? legacyBackgroundHex ?? null,
    dark_background_hex: candidate.dark_background_hex ?? legacyBackgroundHex ?? null,
  };
}, z.object({
  id: StatusNameSchema,
  label: NonEmptyStringSchema,
  emoji: OptionalEmojiSchema,
  light_background_hex: HexColorSchema.nullish().transform((value) => value ?? null),
  dark_background_hex: HexColorSchema.nullish().transform((value) => value ?? null),
  wip_limit: z.number().int().positive().optional(),
}));

export const DoneRuleSchema = z.object({
  required_artifact_types: z.array(ArtifactTypeSchema).default([]),
});

export const BoardSchema = z.object({
  id: StatusNameSchema,
  name: NonEmptyStringSchema,
  emoji: OptionalEmojiSchema.nullish().transform((value) => value ?? null),
  description: NonEmptyStringSchema,
  card_types: z.array(CardTypeSchema).min(1),
  columns: z.array(BoardColumnSchema).min(1),
  done_rules: z.record(StatusNameSchema, DoneRuleSchema).default({}),
});

export const EventSchema = z.object({
  timestamp: IsoTimestampSchema,
  type: EventTypeSchema,
  actor: NonEmptyStringSchema,
  card_id: z.string().regex(/^KAN-\d{4}-\d{4}$/),
  board: StatusNameSchema.optional(),
  status: StatusNameSchema.optional(),
  from_status: StatusNameSchema.optional(),
  from_sitting_with: NonEmptyStringSchema.optional(),
  sitting_with: NonEmptyStringSchema.optional(),
  sitting_reason: NonEmptyStringSchema.optional(),
  sitting_since: IsoTimestampSchema.optional(),
  sitting_expected_action: NonEmptyStringSchema.optional(),
  artifact_type: ArtifactTypeSchema.optional(),
  artifact_label: NonEmptyStringSchema.optional(),
  artifact_path: NonEmptyStringSchema.optional(),
  summary: NonEmptyStringSchema,
});

export const CommentFrontmatterSchema = z.object({
  card_id: z.string().regex(/^KAN-\d{4}-\d{4}$/),
  author: NonEmptyStringSchema,
  created_at: IsoTimestampSchema,
  role: NonEmptyStringSchema,
});

export const FeatureIndexEntrySchema = z.object({
  key: NonEmptyStringSchema,
  kind: z.enum(["feature", "bug", "experiment", "incident"]),
  title: NonEmptyStringSchema,
  card_id: z.string().regex(/^KAN-\d{4}-\d{4}$/),
  card_path: NonEmptyStringSchema,
  owner: NonEmptyStringSchema,
  status: StatusNameSchema,
  artifacts: z.array(
    z.object({
      type: ArtifactTypeSchema,
      path: NonEmptyStringSchema,
    }),
  ),
});

export const FeatureIndexSchema = z.object({
  entries: z.array(FeatureIndexEntrySchema).default([]),
});

export const TeamDirectoryEntrySchema = z.object({
  key: NonEmptyStringSchema,
  kind: z.enum(["person", "functional-alias"]),
  path: NonEmptyStringSchema,
});

export const TeamDirectoryIndexSchema = z.object({
  entries: z.array(TeamDirectoryEntrySchema).default([]),
});

export const TeamDirectoryRecordSchema = z.object({
  id: NonEmptyStringSchema,
  kind: z.enum(["person", "functional-alias"]),
  display_name: NonEmptyStringSchema,
  status: NullableStringSchema,
  summary: NullableStringSchema,
  emoji: OptionalEmojiSchema,
  profile_image_url: NullableStringSchema,
  handles: z.record(z.string(), NonEmptyStringSchema).default({}),
  references: z.array(NonEmptyStringSchema).default([]),
});

export type ArtifactLink = z.infer<typeof ArtifactLinkSchema>;
export type CardFrontmatter = z.infer<typeof CardFrontmatterSchema>;
export type BoardColumn = z.infer<typeof BoardColumnSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type EventRecordData = z.infer<typeof EventSchema>;
export type CommentFrontmatter = z.infer<typeof CommentFrontmatterSchema>;
export type FeatureIndex = z.infer<typeof FeatureIndexSchema>;
export type FeatureIndexEntry = z.infer<typeof FeatureIndexEntrySchema>;
export type TeamDirectoryIndex = z.infer<typeof TeamDirectoryIndexSchema>;
export type TeamDirectoryRecord = z.infer<typeof TeamDirectoryRecordSchema>;

export type EventRecord = EventRecordData & { path: string };
export type CommentRecord = CommentFrontmatter & { path: string; body: string };
export type CardRecord = {
  body: string;
  comments: CommentRecord[];
  dir: string;
  events: EventRecord[];
  frontmatter: CardFrontmatter;
  path: string;
};

export type LoadIssueKind = "board" | "card" | "event" | "comment" | "feature-index" | "team-directory";

export type LoadIssue = {
  kind: LoadIssueKind;
  message: string;
  path: string;
};
