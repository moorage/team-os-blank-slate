import { loadCards } from "./load.js";

type TimelineItem = {
  body: string;
  summary: string;
  timestamp: string;
};

export async function renderCardHistory(root: string, cardId: string): Promise<string> {
  const cards = await loadCards(root);
  const card = cards.find((candidate) => candidate.frontmatter.id === cardId);
  if (!card) {
    throw new Error(`Card ${cardId} was not found.`);
  }

  const items: TimelineItem[] = [
    ...card.events.map((event) => ({
      body: event.summary,
      summary: `event:${event.type}`,
      timestamp: event.timestamp,
    })),
    ...card.comments.map((comment) => ({
      body: comment.body,
      summary: `comment:${comment.author}`,
      timestamp: comment.created_at,
    })),
  ].sort((left, right) => left.timestamp.localeCompare(right.timestamp));

  const lines = items.map((item) => `- ${item.timestamp} | ${item.summary} | ${item.body}`);
  return `# History for ${card.frontmatter.id}\n\n${lines.join("\n")}\n`;
}

export async function renderStandup(root: string): Promise<string> {
  const cards = await loadCards(root);
  const blocked = cards.filter((card) => card.frontmatter.status === "blocked");
  const ready = cards.filter((card) => card.frontmatter.status !== "blocked");

  const blockedLines =
    blocked.length > 0
      ? blocked.map((card) => `- ${card.frontmatter.id} — ${card.frontmatter.title} | sitting with ${card.frontmatter.sitting_with}`)
      : ["No blocked cards."];
  const readyLines =
    ready.length > 0
      ? ready.map((card) => `- ${card.frontmatter.id} — ${card.frontmatter.title} | next action with ${card.frontmatter.sitting_with}`)
      : ["No active cards."];

  return `# Standup Summary\n\n## Blocked\n\n${blockedLines.join("\n")}\n\n## Active\n\n${readyLines.join("\n")}\n`;
}
