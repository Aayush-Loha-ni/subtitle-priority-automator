# Subtitle Priority Automator

Automatically selects your preferred subtitle language on streaming sites.

## Features

- **9 platforms** — YouTube, Netflix, Prime Video, Disney+, Hulu, Crunchyroll, Vimeo, Twitch, donkey.to
- **4-tier fallback** — Platform JS API → HTML5 textTracks → DOM selectors → generic scan
- **25+ languages** — ISO codes, locale variants, native-script labels with fuzzy matching
- **Custom languages** — Add any string >= 2 characters
- **Priority ordering** — Drag to reorder; top language wins
- **Badge status** — Green check (matched), Red X (not found), Gray OFF (disabled)
- **Auto-retry** — Exponential backoff (0s, 1s, 3s, 7s, 15s) for slow-loading players
- **SPA-aware** — Re-checks on video source changes

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this folder

## Usage

1. Click the extension icon
2. Add your preferred subtitle languages in priority order
3. Toggle Start/Stop
4. Navigate to any supported platform — subtitles are selected automatically

## Platform Support

| Platform | API | textTracks | DOM |
|----------|-----|-----------|-----|
| YouTube | Yes | Yes | Yes |
| Netflix | Yes | Yes | Yes |
| Prime Video | No | Yes | Yes |
| Disney+ | No | Yes | Yes |
| Hulu | No | Yes | Yes |
| Crunchyroll | No | Yes | Yes |
| Vimeo | No | Yes | — |
| Twitch | No | Yes | — |
| donkey.to | No | Yes | — |

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Sync language preferences across devices |
| `host_permissions` | YouTube, Netflix, Prime Video, Disney+, Hulu, Crunchyroll, Vimeo, Twitch, donkey.to |

## Privacy

No analytics, no trackers, no third-party SDKs. All data stored locally in `chrome.storage.sync`. Site URLs read in-memory only.

## License

MIT
