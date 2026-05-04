#!/usr/bin/env python3
from __future__ import annotations
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def changed_files():
    try:
        out = subprocess.check_output(
            ["git", "status", "--porcelain"],
            cwd=ROOT,
            text=True
        )
        changed = []
        for line in out.splitlines():
            if not line:
                continue
            path = line[3:]
            if " -> " in path:
                path = path.split(" -> ", 1)[1]
            changed.append(path.strip())
        return changed
    except Exception:
        return []

files = changed_files()
hints = []

if any(f.startswith("apps/web/") or f.startswith("apps/api/") for f in files):
    hints.append("Consider docs/product-specs/* updates for user-visible encounter behavior.")
if any(
    f.startswith("evals/")
    or f.startswith("prompts/")
    or f.startswith("packages/providers/patient-ai/")
    or f.startswith("packages/providers/follow-up/")
    for f in files
):
    hints.append("Consider docs/product-specs/patient-ai-chat.md, patient-follow-up.md, and docs/RELIABILITY.md updates.")
if any("twilio" in f.lower() or "/messaging/" in f for f in files):
    hints.append("Consider docs/product-specs/whatsapp-and-voice.md and docs/SECURITY.md updates.")
if any("claim" in f.lower() or "offer" in f.lower() or "encounter" in f.lower() for f in files):
    hints.append("Consider docs/product-specs/doctor-assignment.md, docs/RELIABILITY.md, and docs/SECURITY.md updates.")
if any("auth" in f.lower() or "security" in f.lower() for f in files):
    hints.append("Consider docs/SECURITY.md updates.")
if any(f.startswith("packages/domain/") for f in files):
    hints.append("Consider docs/ARCHITECTURE.md if boundaries or domain concepts changed.")
if any(f.startswith(".codex/") or f.startswith(".agents/") or f.startswith("scripts/knowledge/") for f in files):
    hints.append("Consider README.md, AGENTS.md, docs/PLANS.md, docs/ideas/README.md, and npm run verify:docs after control-plane changes.")
if any(f.startswith("docs/ideas/") or f == "scripts/check_ideation.py" for f in files):
    hints.append("Keep docs/ideas/index.md authoritative, and run npm run verify:ideas after ideation-harness changes.")
if any(f.startswith("scripts/twilio/") for f in files):
    hints.append("Consider README.md and docs/RELIABILITY.md updates for Twilio bring-up or sync workflow changes.")
if any(f.startswith("apps/web/") or f.startswith("apps/api/") for f in files):
    hints.append("If the change materially alters a visible workflow, capture a new screencast when the environment supports it.")
if not hints:
    hints.append("No obvious doc drift detected by heuristics.")

for hint in dict.fromkeys(hints):
    print(hint)
