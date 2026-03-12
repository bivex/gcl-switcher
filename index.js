#!/usr/bin/env node
/**
 * Copyright (c) 2026 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2026-02-21 03:36
 * Last Updated: 2026-02-24 20:32
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const CONFIG_PATH   = path.join(os.homedir(), '.gcl-switcher.json');

const GLM_BASE_URL = 'https://api.z.ai/api/anthropic';

const GLM_ENV = {
  ANTHROPIC_BASE_URL:              GLM_BASE_URL,
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'glm-4.7',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.7',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'glm-4.5-air',
};

// GLM-5 defaults (coding optimized)
const GLM5_ENV = {
  ANTHROPIC_BASE_URL:              GLM_BASE_URL,
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'glm-5',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-5',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'glm-5',
  // Coding optimizations
  API_TIMEOUT_MS:                  '300000',  // 5 min timeout for long code gen
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'true',  // faster responses
};

// LM Studio (local) defaults
const LM_STUDIO_BASE_URL = 'http://localhost:1234';
const LM_STUDIO_TOKEN = 'lm-studio';
const LM_STUDIO_ENV = {
  ANTHROPIC_BASE_URL: LM_STUDIO_BASE_URL,
  ANTHROPIC_MODEL:    'default',
};

// OpenRouter defaults
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api';
const OPENROUTER_ENV = {
  ANTHROPIC_BASE_URL: OPENROUTER_BASE_URL,
  ANTHROPIC_API_KEY: '',  // Must be explicitly empty to prevent conflicts
};

const GLM_KEYS = ['ANTHROPIC_AUTH_TOKEN', ...Object.keys(GLM_ENV), 'ANTHROPIC_BASE_URL'];
const GLM5_KEYS = ['ANTHROPIC_AUTH_TOKEN', ...Object.keys(GLM5_ENV), 'ANTHROPIC_BASE_URL', 'API_TIMEOUT_MS', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'];
const LM_STUDIO_KEYS = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_MODEL'];
const OPENROUTER_KEYS = ['ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY'];

// ── helpers ────────────────────────────────────────────────────────────────

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function currentMode(settings) {
  const url = settings?.env?.ANTHROPIC_BASE_URL ?? '';
  const opus = settings?.env?.ANTHROPIC_DEFAULT_OPUS_MODEL ?? '';
  if (url.includes('z.ai') && opus === 'glm-5') return 'glm5';
  if (url.includes('z.ai')) return 'glm';
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes(':1234')) return 'lmstudio';
  if (url.includes('openrouter.ai')) return 'openrouter';
  return 'claude';
}

// ── commands ───────────────────────────────────────────────────────────────

function status() {
  const settings = readJson(SETTINGS_PATH);
  const config   = readJson(CONFIG_PATH);
  const mode     = currentMode(settings);

  if (mode === 'glm5') {
    console.log('Active mode: GLM-5 (z.ai)');
    console.log('  Base URL : ' + settings.env.ANTHROPIC_BASE_URL);
    console.log('  Opus     : ' + (settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL   || 'glm-5'));
    console.log('  Sonnet   : ' + (settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-5'));
    console.log('  Haiku    : ' + (settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL  || 'glm-5'));
  } else if (mode === 'glm') {
    console.log('Active mode: GLM (z.ai)');
    console.log('  Base URL : ' + settings.env.ANTHROPIC_BASE_URL);
    console.log('  Opus     : ' + (settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL   || 'glm-4.7'));
    console.log('  Sonnet   : ' + (settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-4.7'));
    console.log('  Haiku    : ' + (settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL  || 'glm-4.5-air'));
  } else if (mode === 'lmstudio') {
    console.log('Active mode: LM Studio (local)');
    console.log('  Base URL : ' + settings.env.ANTHROPIC_BASE_URL);
    console.log('  Token    : ' + (settings.env.ANTHROPIC_AUTH_TOKEN || '(none)'));
  } else if (mode === 'openrouter') {
    console.log('Active mode: OpenRouter');
    console.log('  Base URL : ' + settings.env.ANTHROPIC_BASE_URL);
    const k = settings.env.ANTHROPIC_AUTH_TOKEN || '';
    if (k) console.log('  API key  : ' + k.slice(0, 8) + '...' + k.slice(-4));
    else console.log('  API key  : (none)');
  } else {
    console.log('Active mode: Claude (native)');
  }

  if (config.glmApiKey) {
    const k = config.glmApiKey;
    console.log('  GLM key  : ' + k.slice(0, 8) + '...' + k.slice(-4));
  } else if (mode === 'glm' || mode === 'glm5') {
    console.log('  WARNING  : no API key saved — run: gcl-switcher set-key <key>');
  }
}

function useGlm() {
  const config = readJson(CONFIG_PATH);
  const key    = config.glmApiKey;

  if (!key) {
    console.error('No API key saved. Run first:\n  gcl-switcher set-key <your_z.ai_api_key>');
    process.exit(1);
  }

  const settings = readJson(SETTINGS_PATH);
  settings.env   = settings.env ?? {};

  // clear any GLM5, LM Studio, and OpenRouter keys before switching
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];
  for (const k of OPENROUTER_KEYS) delete settings.env[k];

  settings.env.ANTHROPIC_AUTH_TOKEN = key;
  Object.assign(settings.env, GLM_ENV);

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to GLM (z.ai). Restart Claude Code to apply.');
}

function useGlm5() {
  const config = readJson(CONFIG_PATH);
  const key    = config.glmApiKey;

  if (!key) {
    console.error('No API key saved. Run first:\n  gcl-switcher set-key <your_z.ai_api_key>');
    process.exit(1);
  }

  const settings = readJson(SETTINGS_PATH);
  settings.env   = settings.env ?? {};

  // clear any GLM, LM Studio, and OpenRouter keys before switching
  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];
  for (const k of OPENROUTER_KEYS) delete settings.env[k];

  settings.env.ANTHROPIC_AUTH_TOKEN = key;
  Object.assign(settings.env, GLM5_ENV);

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to GLM-5 (z.ai). Restart Claude Code to apply.');
}

function useLmStudio() {
  const settings = readJson(SETTINGS_PATH);
  settings.env = settings.env ?? {};

  // clear GLM, GLM5, and OpenRouter keys when enabling LM Studio
  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of OPENROUTER_KEYS) delete settings.env[k];

  Object.assign(settings.env, LM_STUDIO_ENV);
  // set a permissive token Claude Code recognizes for LM Studio bridges
  settings.env.ANTHROPIC_AUTH_TOKEN = LM_STUDIO_TOKEN;

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to LM Studio (local). Restart Claude Code to apply.');
}

function useClaude() {
  const settings = readJson(SETTINGS_PATH);
  if (!settings.env) {
    console.log('Already on Claude (native). Nothing changed.');
    return;
  }

  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];
  for (const k of OPENROUTER_KEYS) delete settings.env[k];

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to Claude (native). Restart Claude Code to apply.');
}

function useOpenRouter() {
  const config = readJson(CONFIG_PATH);
  const key    = config.openrouterApiKey;

  if (!key) {
    console.error('No OpenRouter API key saved. Run first:\n  gcl-switcher set-openrouter-key <your_openrouter_api_key>');
    process.exit(1);
  }

  const settings = readJson(SETTINGS_PATH);
  settings.env   = settings.env ?? {};

  // clear GLM, GLM5, and LM Studio keys before switching
  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];

  settings.env.ANTHROPIC_AUTH_TOKEN = key;
  Object.assign(settings.env, OPENROUTER_ENV);

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to OpenRouter. Restart Claude Code to apply.');
}

function setKey(key) {
  if (!key) {
    console.error('Usage: gcl-switcher set-key <api_key>');
    process.exit(1);
  }
  const config   = readJson(CONFIG_PATH);
  config.glmApiKey = key;
  writeJson(CONFIG_PATH, config);
  console.log('GLM API key saved: ' + key.slice(0, 8) + '...' + key.slice(-4));
}

function setOpenRouterKey(key) {
  if (!key) {
    console.error('Usage: gcl-switcher set-openrouter-key <api_key>');
    process.exit(1);
  }
  const config   = readJson(CONFIG_PATH);
  config.openrouterApiKey = key;
  writeJson(CONFIG_PATH, config);
  console.log('OpenRouter API key saved: ' + key.slice(0, 8) + '...' + key.slice(-4));
}

function help() {
  console.log([
    '',
    'gcl-switcher  —  switch Claude Code between GLM, OpenRouter, LM Studio, and native Claude',
    '',
    'Usage:',
    '  gcl-switcher status                      Show active mode and settings',
    '  gcl-switcher use glm                     Switch to GLM (z.ai)',
    '  gcl-switcher use glm5                    Switch to GLM-5 (coding optimized)',
    '  gcl-switcher use openrouter              Switch to OpenRouter',
    '  gcl-switcher use lmstudio                Switch to LM Studio (local)',
    '  gcl-switcher use claude                  Switch to native Claude',
    '  gcl-switcher set-key <api_key>           Save your z.ai API key',
    '  gcl-switcher set-openrouter-key <key>    Save your OpenRouter API key',
    '  gcl-switcher help                        Show this help',
    '',
    'Quickstart (GLM):',
    '  gcl-switcher set-key sk-xxxxxxx          # save key once',
    '  gcl-switcher use glm5                    # activate GLM-5 (best for coding)',
    '',
    'Quickstart (OpenRouter):',
    '  gcl-switcher set-openrouter-key sk-or-xx  # save key once',
    '  gcl-switcher use openrouter               # activate OpenRouter',
    '',
    '  gcl-switcher use claude                  # go back to native Claude',
    '',
    'GLM-5 Coding Features:',
    '  - 200K context, 128K max output',
    '  - SOTA open-weight model for coding',
    '  - Optimized for complex systems & agents',
    '  - Extended timeout (5min) for long code gen',
    '',
    'OpenRouter Features:',
    '  - Provider failover for high availability',
    '  - Organizational budget controls',
    '  - Usage visibility and analytics',
    '  - Get API key at https://openrouter.ai/keys',
    '',
    'Config files:',
    '  ~/.claude/settings.json          Claude Code settings (edited by this tool)',
    '  ~/.gcl-switcher.json             Stores your API keys',
    '',
  ].join('\n'));
}

// ── dispatch ───────────────────────────────────────────────────────────────

const [,, cmd, sub] = process.argv;

switch (cmd) {
  case 'status':
    status();
    break;

  case 'use':
    if (sub === 'glm')        useGlm();
    else if (sub === 'glm5')       useGlm5();
    else if (sub === 'openrouter') useOpenRouter();
    else if (sub === 'lmstudio') useLmStudio();
    else if (sub === 'claude')    useClaude();
    else { console.error('Usage: gcl-switcher use <glm|glm5|openrouter|lmstudio|claude>'); process.exit(1); }
    break;

  case 'set-key':
    setKey(sub);
    break;

  case 'set-openrouter-key':
    setOpenRouterKey(sub);
    break;

  case 'help':
  case '--help':
  case '-h':
  case undefined:
    help();
    break;

  default:
    console.error('Unknown command: ' + cmd);
    help();
    process.exit(1);
}