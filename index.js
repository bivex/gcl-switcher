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
 * Last Updated: 2026-02-21 03:40
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

const GLM_KEYS = ['ANTHROPIC_AUTH_TOKEN', ...Object.keys(GLM_ENV)];

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
  return url.includes('z.ai') ? 'glm' : 'claude';
}

// ── commands ───────────────────────────────────────────────────────────────

function status() {
  const settings = readJson(SETTINGS_PATH);
  const config   = readJson(CONFIG_PATH);
  const mode     = currentMode(settings);

  if (mode === 'glm') {
    console.log('Active mode: GLM (z.ai)');
    console.log('  Base URL : ' + settings.env.ANTHROPIC_BASE_URL);
    console.log('  Opus     : ' + (settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL   || 'glm-4.7'));
    console.log('  Sonnet   : ' + (settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-4.7'));
    console.log('  Haiku    : ' + (settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL  || 'glm-4.5-air'));
  } else {
    console.log('Active mode: Claude (native)');
  }

  if (config.glmApiKey) {
    const k = config.glmApiKey;
    console.log('  API key  : ' + k.slice(0, 8) + '...' + k.slice(-4));
  } else if (mode === 'glm') {
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

  settings.env.ANTHROPIC_AUTH_TOKEN = key;
  Object.assign(settings.env, GLM_ENV);

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to GLM (z.ai). Restart Claude Code to apply.');
}

function useClaude() {
  const settings = readJson(SETTINGS_PATH);
  if (!settings.env) {
    console.log('Already on Claude (native). Nothing changed.');
    return;
  }

  for (const k of GLM_KEYS) delete settings.env[k];

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to Claude (native). Restart Claude Code to apply.');
}

function setKey(key) {
  if (!key) {
    console.error('Usage: gcl-switcher set-key <api_key>');
    process.exit(1);
  }
  const config   = readJson(CONFIG_PATH);
  config.glmApiKey = key;
  writeJson(CONFIG_PATH, config);
  console.log('API key saved: ' + key.slice(0, 8) + '...' + key.slice(-4));
}

function help() {
  console.log([
    '',
    'gcl-switcher  —  switch Claude Code between GLM (z.ai) and native Claude',
    '',
    'Usage:',
    '  gcl-switcher status              Show active mode and settings',
    '  gcl-switcher use glm             Switch to GLM (z.ai)',
    '  gcl-switcher use claude          Switch to native Claude',
    '  gcl-switcher set-key <api_key>   Save your z.ai API key',
    '  gcl-switcher help                Show this help',
    '',
    'Quickstart:',
    '  gcl-switcher set-key sk-xxxxxxx  # save key once',
    '  gcl-switcher use glm             # activate GLM',
    '  gcl-switcher use claude          # go back to native Claude',
    '',
    'Config files:',
    '  ~/.claude/settings.json          Claude Code settings (edited by this tool)',
    '  ~/.gcl-switcher.json             Stores your z.ai API key',
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
    if (sub === 'glm')    useGlm();
    else if (sub === 'claude') useClaude();
    else { console.error('Usage: gcl-switcher use <glm|claude>'); process.exit(1); }
    break;

  case 'set-key':
    setKey(sub);     // "sub" is the positional arg here
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