# Brand rename: Drefit -> Aremo

Aremo (Yoruba *Arẹ̀mọ*, "heir / crown prince"): premium, short, simple to spell.
Tagline-compatible meaning: "train like royalty / own your strength".

## Re-apply (idempotent)
The rename is mechanical. After `feature/neon-migration` and `feature/premium-polish`
merge, run on the merged checkout and commit whatever it changes:

    /workspace/drefit-rename-tools/rename.sh --dry-run .   # preview
    /workspace/drefit-rename-tools/rename.sh .             # apply (text + file names + icons)
    npx tsc --noEmit && npm run lint && npm test && npm run build

(`docs/rename/rename.sh` is an identical copy; this folder is excluded from the rewrite.)
Use `--no-icons` to skip redrawing `public/icons/*.png` with the "A" monogram.

## What the script changes
Display brand only: `Drefit`, `DreFit`, `Dre Fit`, `Dre-Fit`, `DREFIT`, lowercase `dre fit`,
the `D` monogram next to the wordmark, file/folder names containing `Drefit`/`DreFit`,
and the npm package `name` in package.json / package-lock.json.

## What it never changes (identifiers)
- Any URL or hostname (`drefit.vercel.app`, repo URL `general-Dee/drefit`).
- Every lowercase `drefit` token: `drefit_ref` referral cookie, `drefit:pending-completions`
  localStorage key, `drefit:queue-changed` event, `drefit-shell/data/pages-*` service-worker
  caches, `__drefit_rsc` cache key, `drefit-toast` class, tailwind `drefit` colour key.
  Renaming these would drop in-flight referrals, lose queued offline workouts, or orphan caches.
- Env-var-style names (`DREFIT_*`, `*_DREFIT`); none exist today.

## Owner-only (consoles)
See the rename report: Vercel project name + domain, GitHub repo name, Appwrite project
name, Google OAuth consent screen, Paystack business name, Resend FROM_EMAIL display name,
coach WhatsApp Business profile.
