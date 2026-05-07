import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

import { renderCardHistory, renderStandup } from "./history.js";
import { applyNativeMutation, exportNativeSnapshot } from "./native.js";
import { renderAll } from "./render.js";
import { validateRepository } from "./validate.js";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const program = new Command();
program.name("team-os-kanban").description("Validate and render Team OS kanban state.");

program
  .command("validate")
  .option("--root <path>", "Repository root", defaultRoot)
  .option("--write-report-only", "Write the report but do not fail on errors", false)
  .action(async (options) => {
    try {
      const result = await validateRepository(options.root, { writeReportOnly: options.writeReportOnly });
      console.log(`Validation passed. Report: ${result.reportPath}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command("render")
  .option("--root <path>", "Repository root", defaultRoot)
  .option("--stale-days <number>", "Days without movement before a card is stale", (value) => Number(value), 5)
  .action(async (options) => {
    try {
      const outputs = await renderAll(options.root, { staleDays: options.staleDays });
      console.log(outputs.join("\n"));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command("history")
  .requiredOption("--card <id>", "Card id")
  .option("--root <path>", "Repository root", defaultRoot)
  .action(async (options) => {
    try {
      console.log(await renderCardHistory(options.root, options.card));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command("standup")
  .option("--root <path>", "Repository root", defaultRoot)
  .action(async (options) => {
    try {
      console.log(await renderStandup(options.root));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command("native-export")
  .option("--root <path>", "Repository root", defaultRoot)
  .action(async (options) => {
    try {
      console.log(JSON.stringify(await exportNativeSnapshot(options.root)));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command("native-mutate")
  .requiredOption("--input <path>", "Path to a JSON mutation payload file")
  .option("--root <path>", "Repository root", defaultRoot)
  .action(async (options) => {
    try {
      const input = JSON.parse(await readFile(options.input, "utf8"));
      console.log(JSON.stringify(await applyNativeMutation(options.root, input)));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

await program.parseAsync();
