#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "native-app" / "TeamOSAppConfig.json"
DEFAULT_APP_NAME = "Team OS Blank Slate"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Write the checked-in public GitHub App config for the native Team OS clients."
    )
    parser.add_argument("--client-id", required=True, help="GitHub App client ID, for example Iv1.1234567890abcdef")
    parser.add_argument("--app-slug", required=True, help="GitHub App slug used for the install URL")
    parser.add_argument(
        "--app-name",
        default=DEFAULT_APP_NAME,
        help="GitHub App display name shown in the client UI",
    )
    args = parser.parse_args()
    if not re.fullmatch(r"Iv[a-zA-Z0-9.]+", args.client_id):
        parser.error("--client-id must look like a GitHub App client ID, for example Iv1.1234567890abcdef")
    if not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", args.app_slug):
        parser.error("--app-slug must use lowercase letters, numbers, and hyphens only")
    return args


def load_config() -> dict:
    return json.loads(OUT.read_text(encoding="utf-8"))


def write_config(config: dict) -> None:
    OUT.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")


def print_next_steps(app_name: str, client_id: str, app_slug: str) -> None:
    config_path = OUT.relative_to(ROOT)
    install_url = f"https://github.com/apps/{app_slug}/installations/new"
    print(f"Wrote {OUT}")
    print()
    print("Next steps:")
    print(f"1. Commit and push `{config_path}` so the whole team gets `{app_name}`.")
    print("2. Keep these GitHub App secrets out of git and in your team's secure secret manager:")
    print("   - client secret")
    print("   - private key")
    print("   - webhook secret (if you enable webhooks later)")
    print("3. Confirm GitHub App settings:")
    print("   - device flow enabled")
    print("   - expiring user-to-server tokens enabled")
    print("   - repository permissions: contents read/write, metadata read, pull requests read/write")
    print(f"4. Install the app for the target account or org: {install_url}")
    print("5. Tell teammates to pull the latest repo, rebuild the native app, click `Install App` if needed, then `Sign In to GitHub`.")
    print()
    print("Team rollout note:")
    print(f"- GitHub App `{app_name}` is now configured for Team OS.")
    print(f"- Public client ID: {client_id}")
    print(f"- Install URL: {install_url}")
    print("- Everyone should pull latest `main`, rebuild the native app, and reauthorize from the GitHub App panel.")


def main() -> int:
    args = parse_args()
    config = load_config()
    config["gitHubApp"] = {
        "appName": args.app_name,
        "clientID": args.client_id,
        "appSlug": args.app_slug,
    }
    write_config(config)
    print_next_steps(app_name=args.app_name, client_id=args.client_id, app_slug=args.app_slug)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
