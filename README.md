# gcl-switcher

Switch Claude Code between **GLM (z.ai)**, **OpenRouter**, **LM Studio**, and **native Claude** by editing `~/.claude/settings.json`.

## Install

```bash
npm install -g .
```

## Quickstart

```bash
# Save your z.ai API key once
gcl-switcher set-key sk-xxxxxxxxxxxxxxxx

# Switch to GLM-5 (recommended for coding)
gcl-switcher use glm5

# Switch to GLM-4.7
gcl-switcher use glm

# Save your OpenRouter API key
gcl-switcher set-openrouter-key sk-or-xxxxxxxxxxxxxxxx

# Switch to OpenRouter
gcl-switcher use openrouter

# Switch back to native Claude
gcl-switcher use claude

# Check active mode
gcl-switcher status
```

## Commands

| Command | Description |
|---|---|
| `gcl-switcher status` | Show active mode and current settings |
| `gcl-switcher use glm` | Switch to GLM-4.7 (z.ai) |
| `gcl-switcher use glm5` | Switch to GLM-5 (z.ai, coding optimized) |
| `gcl-switcher use openrouter` | Switch to OpenRouter |
| `gcl-switcher use lmstudio` | Switch to LM Studio (local) |
| `gcl-switcher use claude` | Switch to native Claude |
| `gcl-switcher set-key <api_key>` | Save your z.ai API key |
| `gcl-switcher set-openrouter-key <key>` | Save your OpenRouter API key |
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

**`use glm5`** uses `glm-5` for all model tiers with coding optimizations:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "<your_key>",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5",
    "API_TIMEOUT_MS": "300000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "true"
  }
}
```

**`use openrouter`** routes through OpenRouter with provider failover:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "<your_openrouter_key>",
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
    "ANTHROPIC_API_KEY": ""
  }
}
```

**`use claude`** removes those fields, leaving the rest of your settings untouched.

## Config files

| File | Purpose |
|---|---|
| `~/.claude/settings.json` | Claude Code settings (edited by this tool) |
| `~/.gcl-switcher.json` | Stores your API keys (z.ai, OpenRouter) |

## GLM-5 for Coding

GLM-5 is specifically optimized for coding tasks with `gcl-switcher use glm5`:

- **200K context window** - Handle large codebases and long conversations
- **128K max output** - Generate extensive code files in one go
- **SOTA open-weight model** - Best-in-class coding performance among open models
- **Extended 5-minute timeout** - For complex code generation tasks
- **Disabled telemetry** - Faster responses, less overhead

GLM-5 achieves performance comparable to Claude Opus 4.5 on:
- SWE-bench Verified: 77.8 (vs Opus 4.5's 80.9)
- Terminal-Bench 2.0: 56.2 (vs Opus 4.5's 59.3)

## OpenRouter

OpenRouter adds reliability and management between Claude Code and Anthropic's API:

- **Provider Failover** - Automatic failover between multiple Anthropic providers for high availability
- **Budget Controls** - Set spending limits and allocate credits across team members
- **Usage Analytics** - Track usage patterns and monitor costs in real-time via Activity Dashboard

Get an API key at [openrouter.ai/keys](https://openrouter.ai/keys)

## Notes

- Restart Claude Code after switching for changes to take effect.
- Get a z.ai API key at [z.ai/manage-apikey](https://z.ai/manage-apikey/apikey-list).
