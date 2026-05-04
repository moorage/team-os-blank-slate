import { access } from "node:fs/promises";
import path from "node:path";

import type { CardRecord } from "./schemas.js";

export type BrokenLink = {
  label: string;
  path: string;
};

export function resolveRepoRelativePath(root: string, fromFile: string, link: string): string {
  if (link.startsWith("./") || link.startsWith("../")) {
    return path.resolve(path.dirname(fromFile), link);
  }
  return path.resolve(root, link);
}

export async function linkExists(root: string, fromFile: string, link: string): Promise<boolean> {
  try {
    await access(resolveRepoRelativePath(root, fromFile, link));
    return true;
  } catch {
    return false;
  }
}

export async function findBrokenLinks(root: string, card: CardRecord): Promise<BrokenLink[]> {
  const failures: BrokenLink[] = [];
  for (const artifact of card.frontmatter.artifacts) {
    if (!(await linkExists(root, card.path, artifact.path))) {
      failures.push({ label: artifact.label, path: artifact.path });
    }
  }
  return failures;
}
