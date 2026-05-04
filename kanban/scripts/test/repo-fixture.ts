import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export async function createFixtureRepo(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "team-os-kanban-"));
  await cp(path.join(repositoryRoot, "kanban"), path.join(tempRoot, "kanban"), { recursive: true });
  await cp(path.join(repositoryRoot, "product-development"), path.join(tempRoot, "product-development"), { recursive: true });
  return tempRoot;
}

export async function readFixtureFile(root: string, relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

export async function writeFixtureFile(root: string, relativePath: string, contents: string): Promise<void> {
  await writeFile(path.join(root, relativePath), contents, "utf8");
}

export async function disposeFixtureRepo(root: string): Promise<void> {
  await rm(root, { recursive: true, force: true });
}
