# gcl-switcher

Switch Claude Code between **GLM (z.ai)** and **native Claude** by editing `~/.claude/settings.json`.

## Install

```bash
npm install -g .
```

## Quickstart

```bash
# Save your z.ai API key once
gcl-switcher set-key sk-xxxxxxxxxxxxxxxx

# Switch to GLM
gcl-switcher use glm

# Switch back to native Claude
gcl-switcher use claude

# Check active mode
gcl-switcher status
```

## Commands

| Command | Description |
|---|---|
| `gcl-switcher status` | Show active mode and current settings |
| `gcl-switcher use glm` | Switch to GLM (z.ai) |
| `gcl-switcher use claude` | Switch to native Claude |
| `gcl-switcher set-key <api_key>` | Save your z.ai API key |
| `gcl-switcher help` | Show help |

## How it works

**`use glm`** adds to `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "<your_key>",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air"
  }
}
```

**`use claude`** removes those fields, leaving the rest of your settings untouched.

## Config files

| File | Purpose |
|---|---|
| `~/.claude/settings.json` | Claude Code settings (edited by this tool) |
| `~/.gcl-switcher.json` | Stores your z.ai API key |

## Notes

- Restart Claude Code after switching for changes to take effect.
- Get a z.ai API key at [z.ai/manage-apikey](https://z.ai/manage-apikey/apikey-list).
