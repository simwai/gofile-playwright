# gofile-playwright

Upload files to [gofile.io](https://gofile.io) via Playwright, with a lightweight pre-commit asset verification hook.

## Setup

```bash
pnpm install
pnpm exec playwright install chromium
```

## Upload a file

Works with: `jpg`, `jpeg`, `png`, `webp`, `svg`, `mp4`, `webm`, `mov`, `pdf`, and any other file type (filename-row fallback).

```bash
pnpm gofile:upload ./assets/my-image.png
```

This saves the asset metadata to `.gofile-assets.json` — commit this file.

## Verify assets (pre-commit)

Runs automatically on every commit via Husky. Uses plain `fetch` — no Playwright overhead.

```bash
pnpm gofile:verify
```

## How it works

| Script | Tool | Reason |
|---|---|---|
| `gofile:upload` | Playwright | Needs full browser to drive gofile's JS-heavy upload UI |
| `gofile:verify` | `fetch` + HTML string search | gofile's `/d/{hash}` page includes the filename in its HTML — no browser needed |

## Asset store

`.gofile-assets.json` is the single source of truth. Each entry:

```json
{
  "name": "my-image",
  "url": "https://cold3.gofile.io/download/web/.../my-image.png",
  "hash": "81e68a48-50a4-4e9f-9b36-8515b798ae10",
  "uploadedAt": "2026-05-09T15:00:00.000Z"
}
```
