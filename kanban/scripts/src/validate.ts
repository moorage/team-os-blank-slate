import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { findBrokenLinks } from "./links.js";
import { loadRepositorySafely } from "./load.js";
import type { Board, CardRecord, FeatureIndexEntry } from "./schemas.js";

type ValidationIssue = {
  code: string;
  message: string;
  path: string;
};

type ValidationResult = {
  errors: ValidationIssue[];
  reportPath: string;
};

type ArtifactType = CardRecord["frontmatter"]["artifacts"][number]["type"];
type ColumnOrderEntry = {
  cardID: string;
  order: number;
  path: string;
};

const STATUS_EVENT_TYPES = new Set(["created", "status-changed", "blocked", "unblocked"]);
const SITTING_EVENT_TYPES = new Set(["sitting-with-changed", "blocked", "unblocked"]);

function relativePath(root: string, target: string): string {
  return path.relative(root, target).replaceAll(path.sep, "/");
}

function latestStatusEvent(card: CardRecord) {
  return card.events.filter((event) => STATUS_EVENT_TYPES.has(event.type) && event.status).at(-1) ?? null;
}

function latestSittingEvent(card: CardRecord) {
  return card.events.filter((event) => SITTING_EVENT_TYPES.has(event.type) && event.sitting_with).at(-1) ?? null;
}

function missingRequiredArtifacts(card: CardRecord, board: Board): ArtifactType[] {
  const rule = board.done_rules[card.frontmatter.status];
  if (!rule) {
    return [];
  }
  const present = new Set(card.frontmatter.artifacts.map((artifact) => artifact.type));
  return rule.required_artifact_types.filter((artifactType) => !present.has(artifactType));
}

function buildFeatureIndexMap(entries: FeatureIndexEntry[]) {
  return new Map(entries.map((entry) => [entry.key, entry]));
}

function cardIdentityReferences(card: CardRecord): Array<{ field: string; value: string }> {
  const references = [
    { field: "owner", value: card.frontmatter.owner },
    ...card.frontmatter.assignees.map((value) => ({ field: "assignees", value })),
    ...card.frontmatter.reviewers.map((value) => ({ field: "reviewers", value })),
    ...card.frontmatter.watchers.map((value) => ({ field: "watchers", value })),
    ...card.frontmatter.collaborators.map((value) => ({ field: "collaborators", value })),
  ];
  if (card.frontmatter.sitting_with) {
    references.push({ field: "sitting_with", value: card.frontmatter.sitting_with });
  }
  return references;
}

async function writeValidationReport(root: string, errors: ValidationIssue[]): Promise<string> {
  const viewsDir = path.join(root, "kanban", "views");
  const reportPath = path.join(viewsDir, "validation-errors.md");
  await mkdir(viewsDir, { recursive: true });
  const body =
    errors.length === 0
      ? "# Validation Errors\n\nNo validation errors found.\n"
      : `# Validation Errors\n\n${errors
          .map((error) => `- [${error.code}] ${error.path}: ${error.message}`)
          .join("\n")}\n`;
  await writeFile(reportPath, body, "utf8");
  return reportPath;
}

export async function collectValidationIssues(root: string): Promise<ValidationIssue[]> {
  const { boards, cards, featureIndex, teamDirectory, issues } = await loadRepositorySafely(root);
  const errors: ValidationIssue[] = issues.map((issue) => ({
    code: `malformed-${issue.kind}`,
    message: issue.message,
    path: relativePath(root, issue.path),
  }));

  const boardsById = new Map(boards.map((board) => [board.id, board]));
  const featureIndexByKey = buildFeatureIndexMap(featureIndex.entries);
  const teamDirectoryKeys = new Set(teamDirectory.entries.map((entry) => entry.key));
  const counts = new Map<string, number>();
  const cardIds = new Map<string, string[]>();
  const columnOrders = new Map<string, ColumnOrderEntry[]>();

  for (const card of cards) {
    const relCardPath = relativePath(root, card.path);
    const { frontmatter } = card;

    if (path.basename(card.dir) !== frontmatter.id) {
      errors.push({
        code: "card-directory-mismatch",
        message: `Directory name ${path.basename(card.dir)} does not match card id ${frontmatter.id}.`,
        path: relCardPath,
      });
    }

    const seenPaths = cardIds.get(frontmatter.id) ?? [];
    seenPaths.push(relCardPath);
    cardIds.set(frontmatter.id, seenPaths);

    const board = boardsById.get(frontmatter.board);
    if (!board) {
      errors.push({
        code: "missing-board",
        message: `Board ${frontmatter.board} does not exist.`,
        path: relCardPath,
      });
      continue;
    }

    for (const reference of cardIdentityReferences(card)) {
      if (!teamDirectoryKeys.has(reference.value)) {
        errors.push({
          code: "unknown-team-identifier",
          message: `Field ${reference.field} references ${reference.value}, which is missing from team/people/index.yaml.`,
          path: relCardPath,
        });
      }
    }

    if (!board.card_types.includes(frontmatter.type)) {
      errors.push({
        code: "unsupported-card-type",
        message: `Board ${board.id} does not allow card type ${frontmatter.type}.`,
        path: relCardPath,
      });
    }

    const hasKnownStatus = board.columns.some((column) => column.id === frontmatter.status);
    if (!hasKnownStatus) {
      errors.push({
        code: "unknown-status",
        message: `Status ${frontmatter.status} is not defined on board ${board.id}.`,
        path: relCardPath,
      });
    }

    if ((frontmatter.type === "bug" || frontmatter.type === "incident") && frontmatter.severity === null) {
      errors.push({
        code: "missing-severity",
        message: "Bug and incident cards must define severity.",
        path: relCardPath,
      });
    }

    const statusEvent = latestStatusEvent(card);
    if (statusEvent && statusEvent.status !== frontmatter.status) {
      errors.push({
        code: "status-history-mismatch",
        message: `Latest status event says ${statusEvent.status} but card.md says ${frontmatter.status}.`,
        path: relCardPath,
      });
    }

    const sittingEvent = latestSittingEvent(card);
    if (sittingEvent) {
      if (frontmatter.sitting_with !== sittingEvent.sitting_with) {
        errors.push({
          code: "sitting-with-mismatch",
          message: `Latest sitting-with event says ${sittingEvent.sitting_with} but card.md says ${frontmatter.sitting_with}.`,
          path: relCardPath,
        });
      }
      if ((frontmatter.sitting_reason ?? null) !== (sittingEvent.sitting_reason ?? null)) {
        errors.push({
          code: "sitting-reason-mismatch",
          message: "Latest sitting-with event reason does not match card.md.",
          path: relCardPath,
        });
      }
    }

    for (const brokenLink of await findBrokenLinks(root, card)) {
      errors.push({
        code: "broken-link",
        message: `Artifact link ${brokenLink.label} points to missing path ${brokenLink.path}.`,
        path: relCardPath,
      });
    }

    if (frontmatter.feature_index_key) {
      const entry = featureIndexByKey.get(frontmatter.feature_index_key);
      if (!entry) {
        errors.push({
          code: "missing-feature-index-entry",
          message: `feature_index_key ${frontmatter.feature_index_key} does not exist in product-development/feature-index.yaml.`,
          path: relCardPath,
        });
      } else {
        if (entry.card_id !== frontmatter.id) {
          errors.push({
            code: "feature-index-card-mismatch",
            message: `Feature index entry ${entry.key} points to ${entry.card_id} instead of ${frontmatter.id}.`,
            path: relCardPath,
          });
        }
        if (entry.card_path !== relCardPath) {
          errors.push({
            code: "feature-index-path-mismatch",
            message: `Feature index entry ${entry.key} points to ${entry.card_path} instead of ${relCardPath}.`,
            path: relCardPath,
          });
        }
      }
    }

    for (const missingArtifact of missingRequiredArtifacts(card, board)) {
      errors.push({
        code: "missing-required-artifact",
        message: `Status ${frontmatter.status} requires artifact type ${missingArtifact}.`,
        path: relCardPath,
      });
    }

    const columnKey = `${board.id}:${frontmatter.status}`;
    counts.set(columnKey, (counts.get(columnKey) ?? 0) + 1);
    if (hasKnownStatus) {
      const entries = columnOrders.get(columnKey) ?? [];
      entries.push({
        cardID: frontmatter.id,
        order: frontmatter.column_order,
        path: relCardPath,
      });
      columnOrders.set(columnKey, entries);
    }
  }

  for (const [cardId, occurrences] of cardIds.entries()) {
    if (occurrences.length > 1) {
      for (const occurrence of occurrences) {
        errors.push({
          code: "duplicate-card-id",
          message: `Card id ${cardId} appears multiple times: ${occurrences.join(", ")}.`,
          path: occurrence,
        });
      }
    }
  }

  for (const board of boards) {
    const seenColumnIDs = new Set<string>();
    for (const column of board.columns) {
      if (seenColumnIDs.has(column.id)) {
        errors.push({
          code: "duplicate-board-column-id",
          message: `Board ${board.id} defines column ${column.id} more than once.`,
          path: `kanban/boards/${board.id}.board.yaml`,
        });
      } else {
        seenColumnIDs.add(column.id);
      }

      const columnKey = `${board.id}:${column.id}`;
      const entries = columnOrders.get(columnKey) ?? [];
      const duplicateGroups = new Map<number, ColumnOrderEntry[]>();
      for (const entry of entries) {
        duplicateGroups.set(entry.order, [...(duplicateGroups.get(entry.order) ?? []), entry]);
      }
      let hasDuplicateOrders = false;
      for (const [order, group] of duplicateGroups.entries()) {
        if (group.length < 2) {
          continue;
        }
        hasDuplicateOrders = true;
        const conflictingCards = group.map((entry) => entry.cardID).join(", ");
        for (const entry of group) {
          errors.push({
            code: "duplicate-column-order",
            message: `Column order ${order} is duplicated in status ${column.id} on board ${board.id}. Conflicting cards: ${conflictingCards}.`,
            path: entry.path,
          });
        }
      }
      if (!hasDuplicateOrders && entries.length > 0) {
        const actualOrders = entries
          .map((entry) => entry.order)
          .slice()
          .sort((left, right) => left - right);
        const expectedOrders = Array.from({ length: entries.length }, (_, index) => index + 1);
        const isContiguous = actualOrders.every((order, index) => order === expectedOrders[index]);
        if (!isContiguous) {
          const reportPath = entries
            .slice()
            .sort((left, right) => left.order - right.order || left.cardID.localeCompare(right.cardID))[0]?.path
            ?? `kanban/boards/${board.id}.board.yaml`;
          errors.push({
            code: "noncontiguous-column-order",
            message: `Status ${column.id} on board ${board.id} must use contiguous column_order values starting at 1. Found ${actualOrders.join(", ")}.`,
            path: reportPath,
          });
        }
      }

      if (!column.wip_limit) {
        continue;
      }
      const count = counts.get(columnKey) ?? 0;
      if (count > column.wip_limit) {
        errors.push({
          code: "wip-limit-exceeded",
          message: `Column ${column.id} on board ${board.id} has ${count} cards and exceeds WIP limit ${column.wip_limit}.`,
          path: `kanban/boards/${board.id}.board.yaml`,
        });
      }
    }
  }

  errors.sort((left, right) => {
    const byPath = left.path.localeCompare(right.path);
    if (byPath !== 0) {
      return byPath;
    }
    return left.code.localeCompare(right.code);
  });

  return errors;
}

export async function validateRepository(
  root: string,
  options: { writeReportOnly?: boolean } = {},
): Promise<ValidationResult> {
  const errors = await collectValidationIssues(root);
  const reportPath = await writeValidationReport(root, errors);
  if (!options.writeReportOnly && errors.length > 0) {
    throw new Error(`Validation failed with ${errors.length} error(s). See ${relativePath(root, reportPath)}.`);
  }
  return { errors, reportPath };
}
