#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/moorage/team-os-blank-slate.git"

usage() {
  cat <<'EOF'
Usage:
  ./install.sh [target-folder]
  ./install.sh --name target-folder

Creates a new Team OS folder by copying this repository from GitHub,
excluding the repository's install.sh bootstrap script and .git metadata.
If no target folder is provided, the script prompts for one.
EOF
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

target_folder=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    -n|--name)
      [ "$#" -ge 2 ] || fail "--name requires a value"
      target_folder="$2"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*)
      fail "Unknown option: $1"
      ;;
    *)
      [ -z "$target_folder" ] || fail "Target folder already specified as '$target_folder'"
      target_folder="$1"
      shift
      ;;
  esac
done

[ "$#" -eq 0 ] || fail "Unexpected extra arguments: $*"

if [ -z "$target_folder" ]; then
  read -r -p "Enter a name for the new Team OS folder: " target_folder
fi

target_folder="$(trim "$target_folder")"
[ -n "$target_folder" ] || fail "Target folder name cannot be empty"
[ ! -e "$target_folder" ] || fail "Target path already exists: $target_folder"

require_command git
require_command tar
require_command mktemp

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

checkout_dir="$tmp_dir/source"
git clone --depth 1 "$REPO_URL" "$checkout_dir" >/dev/null 2>&1

mkdir -p "$target_folder"

(
  cd "$checkout_dir"
  tar \
    --exclude=.git \
    --exclude=install.sh \
    -cf - .
) | (
  cd "$target_folder"
  tar -xf -
)

printf "Created '%s' from %s\n" "$target_folder" "$REPO_URL"
