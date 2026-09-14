#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_REPOSITORY:?Renseigner proprietaire/depot}"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
for branch in main develop; do
  gh api --method PUT "repos/$GITHUB_REPOSITORY/branches/$branch/protection" \
    --input "$script_dir/branch-protection.json"
done
gh api --method PATCH "repos/$GITHUB_REPOSITORY" \
  -F allow_squash_merge=true -F allow_merge_commit=true -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true -f squash_merge_commit_title=PR_TITLE
