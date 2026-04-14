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

# Switch to GLM-5.1 (recommended default on z.ai)
gcl-switcher use glm51

# Switch to GLM-5
gcl-switcher use glm5

# Switch to GLM-5-Turbo
gcl-switcher use glm5turbo

# Switch to GLM-4.7
gcl-switcher use glm

# Save your OpenRouter API key
gcl-switcher set-openrouter-key sk-or-xxxxxxxxxxxxxxxx

# Switch to OpenRouter (Claude models - default)
gcl-switcher use openrouter

# Switch to OpenRouter with different tiers
gcl-switcher use openrouter free     # Free models (Gemma)
gcl-switcher use openrouter gemini   # Google Gemini
gcl-switcher use openrouter gpt      # OpenAI GPT
gcl-switcher use openrouter stepfun  # StepFun

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
| `gcl-switcher use glm51` | Switch to GLM-5.1 (z.ai, latest on all GLM Coding plans) |
| `gcl-switcher use glm5` | Switch to GLM-5 (z.ai, coding optimized) |
| `gcl-switcher use glm5turbo` | Switch to GLM-5-Turbo (z.ai, faster premium profile) |
| `gcl-switcher use openrouter [tier]` | Switch to OpenRouter (claude\|free\|gemini\|gpt\|stepfun\|hunter\|elephant) |
| `gcl-switcher use lmstudio` | Switch to LM Studio (local) |
| `gcl-switcher use claude` | Switch to native Claude |
| `gcl-switcher set-key <api_key>` | Save your z.ai API key |
| `gcl-switcher set-openrouter-key <key>` | Save your OpenRouter API key |
| `gcl-switcher set-openrouter-models <tier> <model>` | Set custom OpenRouter model |
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

**`use glm51`** uses `glm-5.1` for all model tiers with coding optimizations:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "<your_key>",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5.1",
    "API_TIMEOUT_MS": "300000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "true"
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

**`use glm5turbo`** uses `glm-5-turbo` for all model tiers with coding optimizations:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "<your_key>",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5-turbo",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5-turbo",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5-turbo",
    "API_TIMEOUT_MS": "300000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "true"
  }
}
```

**`use openrouter [tier]`** routes through OpenRouter with provider failover:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "<your_openrouter_key>",
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
    "ANTHROPIC_API_KEY": "",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "anthropic/claude-opus-4-20250514",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "anthropic/claude-sonnet-4-20250514",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "anthropic/claude-3-5-haiku-20241022"
  }
}
```

### OpenRouter Tiers

Pre-configured model tiers for quick switching:

| Tier | Opus | Sonnet | Haiku |
|---|---|---|---|
| `claude` (default) | `claude-opus-4` | `claude-sonnet-4` | `claude-3-5-haiku` |
| `free` | `gemma-3-27b` | `gemma-3-27b` | `gemma-3-4b` |
| `gemini` | `gemini-2.5-pro` | `gemini-2.5-flash` | `gemini-2.0-flash-exp` |
| `gpt` | `o3-mini` | `gpt-4o` | `gpt-4o-mini` |
| `stepfun` | `step-3.5-flash:free` | `step-3.5-flash:free` | `step-3.5-flash:free` |
| `hunter` | `hunter-alpha` | `hunter-alpha` | `hunter-alpha` |
| `elephant` | `elephant-alpha` | `elephant-alpha` | `elephant-alpha` |

```bash
gcl-switcher use openrouter claude    # Claude models (default)
gcl-switcher use openrouter free      # Free tier
gcl-switcher use openrouter gemini    # Google Gemini
gcl-switcher use openrouter gpt       # OpenAI GPT
gcl-switcher use stepfun              # StepFun
gcl-switcher use openrouter hunter    # Hunter Alpha
gcl-switcher use elephant             # Elephant Alpha (free)
```

### Setting Custom OpenRouter Models

Customize which models OpenRouter uses for each tier:

```bash
# Set custom models
gcl-switcher set-openrouter-models opus anthropic/claude-opus-4-20250514
gcl-switcher set-openrouter-models sonnet anthropic/claude-sonnet-4-20250514
gcl-switcher set-openrouter-models haiku anthropic/claude-3-5-haiku-20241022

# Or use other models from OpenRouter
gcl-switcher set-openrouter-models opus google/gemini-2.5-pro
gcl-switcher set-openrouter-models sonnet openai/gpt-4o

# Then activate
gcl-switcher use openrouter
```

Browse available models at [openrouter.ai/models](https://openrouter.ai/models)

**`use claude`** removes those fields, leaving the rest of your settings untouched.

## Config files

| File | Purpose |
|---|---|
| `~/.claude/settings.json` | Claude Code settings (edited by this tool) |
| `~/.gcl-switcher.json` | Stores your API keys and OpenRouter model preferences |

## GLM for Coding

Latest z.ai coding modes supported by `gcl-switcher`:

- **`glm51`** - `GLM-5.1`, best default choice and available on all GLM Coding plans
- **`glm5`** - `GLM-5`, higher-end coding model
- **`glm5turbo`** - `GLM-5-Turbo`, faster premium variant
- **200K context window** - Handle large codebases and long conversations
- **128K max output** - Generate extensive code files in one go
- **Extended 5-minute timeout** - For complex code generation tasks

GLM-5 achieves performance comparable to Claude Opus 4.5 on:
- SWE-bench Verified: 77.8 (vs Opus 4.5's 80.9)
- Terminal-Bench 2.0: 56.2 (vs Opus 4.5's 59.3)

## OpenRouter

OpenRouter adds reliability and management between Claude Code and Anthropic's API:

- **Provider Failover** - Automatic failover between multiple Anthropic providers for high availability
- **Budget Controls** - Set spending limits and allocate credits across team members
- **Usage Analytics** - Track usage patterns and monitor costs in real-time via Activity Dashboard
- **Model Tiers** - Quick switching between Claude, Free (Gemma), Gemini, GPT, and StepFun models

Get an API key at [openrouter.ai/keys](https://openrouter.ai/keys)

## Notes

- Restart Claude Code after switching for changes to take effect.
- Get a z.ai API key at [z.ai/manage-apikey](https://z.ai/manage-apikey/apikey-list).
