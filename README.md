# We-ne (instant-grant-core)

We-ne is an open-source prototype/evaluation kit for non-custodial support distribution and participation tickets on Solana, focused on independent auditability and anti-double-claim using receipt records.

> Status (as of February 11, 2026): **PoC / devnet-first**. This repository is for reproducibility and reviewer verification, not production mainnet operation.

[Japanese README](./README.ja.md) | [Architecture](./docs/ARCHITECTURE.md) | [Devnet Setup](./docs/DEVNET_SETUP.md) | [Security](./docs/SECURITY.md)

## What This Prototype Solves

- Non-custodial distribution: recipients sign with their own wallet; the app does not custody private keys.
- Auditability: tx/receipt can be independently verified in Solana Explorer.
- Anti-double-claim: one-claim behavior is enforced via receipt logic, and repeated school claims return an already-joined result instead of another payout.

## Current PoC Status

- Devnet E2E claim flow is available (wallet sign -> send -> Explorer verification).
- School event QR flow is available (`/admin` -> print QR -> `/u/scan` -> `/u/confirm` -> `/u/success`).
- Success screen can show tx signature + receipt pubkey + Explorer links (devnet).
- Re-claim is handled as operational completion (`already joined`) with no double payout.

## Quickstart (Local)

```bash
cd wene-mobile
npm i
npm run dev:full
```

Then open:

- Admin list: `http://localhost:8081/admin`
- User scan entry: `http://localhost:8081/u/scan?eventId=evt-001`

## Quickstart (Cloudflare Pages)

Cloudflare Pages settings for this monorepo:

- Root directory: `wene-mobile`
- Build command: `npm ci && npm run export:web`
- Output directory: `dist`

Required for `export:web`:

- Set `EXPO_PUBLIC_API_BASE_URL` (or `EXPO_PUBLIC_SCHOOL_API_BASE_URL`) to your Worker URL.
- If not set, `scripts/gen-redirects.js` fails; without generated proxy redirects, `/api/*` and `/v1/*` hit Pages directly and can return `405` or HTML.

Copy-paste deployment commands:

```bash
cd wene-mobile
EXPO_PUBLIC_API_BASE_URL="https://<your-worker>.workers.dev" npm run export:web
npm run deploy:pages
npm run verify:pages
```

## Demo / Reproduction (1-page)

1. Open admin events: `/admin`
2. Open event detail: `/admin/events/<eventId>` (example: `evt-001`, state should be `published`).
3. From event detail, open print page (`印刷用PDF`) -> `/admin/print/<eventId>`.
4. Confirm printed QR resolves to: `/u/scan?eventId=<eventId>`.
5. On user side, open the QR URL -> continue to `/u/confirm?eventId=<eventId>` -> claim -> `/u/success?eventId=<eventId>`.
6. On success page, verify tx signature and receipt pubkey Explorer links:
- `https://explorer.solana.com/tx/<signature>?cluster=devnet`
- `https://explorer.solana.com/address/<receiptPubkey>?cluster=devnet`
7. Re-open the same QR and claim again: expected behavior is `already joined` treated as operational completion (no double payout).

## Verification Commands

Pages verification chain:

```bash
cd wene-mobile
npm run export:web
npm run deploy:pages
npm run verify:pages
```

`verify:pages` checks:

- `/admin` served bundle SHA256 matches local `dist` bundle.
- `GET /v1/school/events` returns `200` with `application/json`.
- `POST /api/users/register` is **not** `405 Method Not Allowed`.

Manual spot checks:

```bash
BASE="https://<your-pages-domain>"

curl -sS -D - "$BASE/v1/school/events" -o /tmp/wene_events.json | sed -n '1p;/content-type/p'
curl -sS -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'Content-Type: application/json' \
  -d '{}' \
  "$BASE/api/users/register"
```

## Troubleshooting / Known Behaviors

- `/v1/school/events` returns HTML: `_redirects` proxy is missing/not applied, or a wrong artifact was deployed.
- `/_redirects` returns 404 when fetched directly: this can be normal on Pages; rely on runtime checks (`/v1` JSON and `/api` non-405) instead.
- Login/user state may persist in browser/device storage by design; use private browsing for shared-device review.
- `/u/scan` camera UI is currently mocked on web; recommended handoff is scanning the printed QR with a phone camera/QR reader to open `/u/scan?eventId=...`.

## Detailed Docs

- School PoC guide: `./wene-mobile/README_SCHOOL.md`
- Cloudflare Pages deployment notes: `./wene-mobile/docs/CLOUDFLARE_PAGES.md`
- Worker API details: `./api-worker/README.md`
- Devnet setup: `./docs/DEVNET_SETUP.md`

## Reviewer Context

This repo is a prototype/evaluation kit for grant and PoC reviewers. The priority is reproducibility and independent verification (especially via Explorer evidence), not marketing scope.
