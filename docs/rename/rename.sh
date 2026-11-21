#!/usr/bin/env bash
# Mechanical, idempotent brand rename: Drefit -> Aremo.
# Changes DISPLAY brand text only. Infrastructure identifiers (URLs/hostnames, cookie,
# localStorage, cache and event keys, CSS/tailwind tokens, env var names, Appwrite IDs,
# repo slug) are masked and left untouched. Safe to re-run on any branch / merged result.
#
# usage: rename.sh [--dry-run] [--no-icons] [REPO_DIR]
#   REPO_DIR defaults to the current directory. Must be a git work tree.
set -euo pipefail
DRY=0; ICONS=1; REPO="."
for a in "$@"; do case "$a" in --dry-run) DRY=1;; --no-icons) ICONS=0;; *) REPO="$a";; esac; done
cd "$REPO"; git rev-parse --is-inside-work-tree >/dev/null
TOOLS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEW="Aremo"; NEW_LC="aremo"; NEW_UC="AREMO"; NEW_INITIAL="A"
export NEW NEW_LC NEW_UC NEW_INITIAL

# Text files: tracked + untracked-not-ignored, minus generated/vendored/backups and the script copy.
mapfile -t FILES < <( { git ls-files; git ls-files --others --exclude-standard; } | sort -u |
  grep -Ev '(^|/)(node_modules|\.next|\.git|\.vercel)/|\.bak$|\.pre-rename-[0-9]+\.bak$|^docs/rename/|\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip|gz|tgz|mp4|mov)$' |
  while read -r f; do [ -f "$f" ] && grep -Iq . "$f" 2>/dev/null && grep -Eqi 'dre[ -]?fit' "$f" && echo "$f"; done || true )

changed=0
for f in "${FILES[@]}"; do
  base="$(basename "$f")"
  if [ "$base" = "package.json" ] || [ "$base" = "package-lock.json" ]; then
    # npm package name only (not infrastructure; Vercel does not read it).
    res="$(DRY=$DRY node -e '
      const fs=require("fs");const f=process.argv[1];const raw=fs.readFileSync(f,"utf8");const j=JSON.parse(raw);
      let c=false; if(j.name==="drefit"){j.name=process.env.NEW_LC;c=true}
      if(j.packages&&j.packages[""]&&j.packages[""].name==="drefit"){j.packages[""].name=process.env.NEW_LC;c=true}
      if(c){const ind=(raw.match(/\n( +)"/)||[,"  "])[1];
        if(process.env.DRY!=="1")fs.writeFileSync(f,JSON.stringify(j,null,ind)+(raw.endsWith("\n")?"\n":""));
        process.stdout.write("changed")}' "$f")"
    if [ "$res" = changed ]; then changed=$((changed+1)); echo "pkg-name: $f"; fi
    continue
  fi
  tmp="$(mktemp)"
  perl -0777 -pe '
    my @keep; my $mask = sub { push @keep, $_[0]; "\x{1}KEEP".$#keep."\x{1}" };
    # 1) protect infrastructure identifiers (case-insensitive brand inside them)
    s{(https?://[^\s"'"'"'`<>)]*)}{$mask->($1)}ge;                       # any URL
    s{\b([\w.-]*dre-?fit[\w-]*\.(?:vercel\.app|app|com|ng|io|dev|net|org|menu)\b)}{$mask->($1)}gie; # bare hostnames
    s{(general-Dee/[\w.-]+)}{$mask->($1)}ge;                               # GitHub repo slug
    s{(\b[A-Z0-9_]*_DREFIT\b|\bDREFIT_[A-Z0-9_]*)}{$mask->($1)}ge;          # env-var style names
    s{(drefit|dre-fit)}{$mask->($1)}ge;   # ALL lowercase forms = identifiers (drefit_ref cookie, drefit: storage/event keys,
                                          # drefit-* cache names, __drefit_rsc, drefit-toast, tailwind key, npm/Appwrite ids)
    # 2) monogram letter next to the wordmark (Logo.tsx, offline.html): >D</span> Drefit
    s{>D(</(?:span|b)>\s*)(?=(?:Drefit|DreFit|Dre Fit|$ENV{NEW})\b)}{>$ENV{NEW_INITIAL}$1}g;
    # 3) display brand variants
    s{\bDre[ -]Fit\b}{$ENV{NEW}}g; s{\bDreFit\b}{$ENV{NEW}}g; s{\bDrefit\b}{$ENV{NEW}}g;
    s{\bDREFIT\b}{$ENV{NEW_UC}}g; s{\bDRE[ -]FIT\b}{$ENV{NEW_UC}}g;
    s{\bdre fit\b}{$ENV{NEW_LC}}g;      # lowercase prose with a space is never an identifier
    # 4) restore
    s{\x{1}KEEP(\d+)\x{1}}{$keep[$1]}g;
  ' "$f" > "$tmp"
  if ! cmp -s "$f" "$tmp"; then changed=$((changed+1)); echo "text: $f"; [ $DRY = 1 ] && diff -u "$f" "$tmp" | sed -n '3,200p' | grep -E '^[-+]' || true; [ $DRY = 1 ] || cat "$tmp" > "$f"; fi
  rm -f "$tmp"
done

# File / folder names containing the display brand (Drefit/DreFit). Lowercase "drefit" paths are
# treated as identifiers (could be URLs/imports) and only reported.
while IFS= read -r p; do
  [ -e "$p" ] || continue
  np="$(printf '%s' "$p" | sed -E "s/Dre[ -]?[Ff]it/$NEW/g")"   # whole path, so folders are renamed too
  if [ "$p" != "$np" ]; then echo "rename: $p -> $np"; changed=$((changed+1))
    if [ $DRY = 0 ]; then mkdir -p "$(dirname "$np")"; git mv "$p" "$np"; fi; fi
done < <(git ls-files | grep -E 'Dre[ -]?[Ff]it' || true)
[ $DRY = 1 ] || find . -depth -type d -regex '.*Dre[ -]?[Ff]it[^/]*' -not -path './node_modules/*' -not -path './.git/*' -empty -delete 2>/dev/null || true
git ls-files | grep -E 'drefit|dre-fit' | sed 's/^/report-only lowercase path: /' || true

if [ $ICONS = 1 ] && [ $DRY = 0 ] && ls public/icons/*.png >/dev/null 2>&1; then
  python3 "$TOOLS/make-icons.py" "$PWD" "$NEW_INITIAL"
fi

echo "files changed: $changed (dry-run=$DRY)"
echo "--- remaining case-insensitive matches (expected: identifiers/URLs only) ---"
git grep -nIiE 'dre[ -]?fit' -- . ':!package-lock.json' ':!docs/rename/**' || echo "(none)"
