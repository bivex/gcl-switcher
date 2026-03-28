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

const GLM51_ENV = {
  ANTHROPIC_BASE_URL:              GLM_BASE_URL,
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'glm-5.1',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-5.1',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'glm-5.1',
  API_TIMEOUT_MS:                  '300000',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'true',
};

const GLM5_TURBO_ENV = {
  ANTHROPIC_BASE_URL:              GLM_BASE_URL,
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'glm-5-turbo',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-5-turbo',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'glm-5-turbo',
  API_TIMEOUT_MS:                  '300000',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'true',
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
const OPENROUTER_DEFAULT_MODELS = {
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'anthropic/claude-opus-4-20250514',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'anthropic/claude-sonnet-4-20250514',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'anthropic/claude-3-5-haiku-20241022',
};
const OPENROUTER_FREE_MODELS = {
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'google/gemma-3-27b-it',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'google/gemma-3-27b-it',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'google/gemma-3-4b-it',
};
const OPENROUTER_GEMINI_MODELS = {
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'google/gemini-2.5-pro',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'google/gemini-2.5-flash',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'google/gemini-2.0-flash-exp',
};
const OPENROUTER_GPT_MODELS = {
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'openai/o3-mini',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'openai/gpt-4o',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'openai/gpt-4o-mini',
};
const OPENROUTER_STEPFUN_MODELS = {
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'stepfun/step-3.5-flash:free',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'stepfun/step-3.5-flash:free',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'stepfun/step-3.5-flash:free',
};
const OPENROUTER_HUNTER_MODELS = {
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'openrouter/hunter-alpha',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'openrouter/hunter-alpha',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'openrouter/hunter-alpha',
};
const OPENROUTER_NEMOTRON_MODELS = {
  ANTHROPIC_DEFAULT_OPUS_MODEL:   'nvidia/nemotron-3-super-120b-a12b:free',
  ANTHROPIC_DEFAULT_SONNET_MODEL: 'nvidia/nemotron-3-super-120b-a12b:free',
  ANTHROPIC_DEFAULT_HAIKU_MODEL:  'nvidia/nemotron-3-super-120b-a12b:free',
};
const OPENROUTER_ENV = {
  ANTHROPIC_BASE_URL: OPENROUTER_BASE_URL,
  ANTHROPIC_API_KEY: '',  // Must be explicitly empty to prevent conflicts
};

const GLM_KEYS = ['ANTHROPIC_AUTH_TOKEN', ...Object.keys(GLM_ENV), 'ANTHROPIC_BASE_URL'];
const GLM5_KEYS = ['ANTHROPIC_AUTH_TOKEN', ...Object.keys(GLM5_ENV), 'ANTHROPIC_BASE_URL', 'API_TIMEOUT_MS', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'];
const GLM51_KEYS = ['ANTHROPIC_AUTH_TOKEN', ...Object.keys(GLM51_ENV), 'ANTHROPIC_BASE_URL', 'API_TIMEOUT_MS', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'];
const GLM5_TURBO_KEYS = ['ANTHROPIC_AUTH_TOKEN', ...Object.keys(GLM5_TURBO_ENV), 'ANTHROPIC_BASE_URL', 'API_TIMEOUT_MS', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'];
const LM_STUDIO_KEYS = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_MODEL'];
const OPENROUTER_KEYS = ['ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_DEFAULT_OPUS_MODEL', 'ANTHROPIC_DEFAULT_SONNET_MODEL', 'ANTHROPIC_DEFAULT_HAIKU_MODEL'];

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
  if (url.includes('z.ai') && opus === 'glm-5.1') return 'glm51';
  if (url.includes('z.ai') && opus === 'glm-5-turbo') return 'glm5turbo';
  if (url.includes('z.ai') && opus === 'glm-5') return 'glm5';
  if (url.includes('z.ai')) return 'glm';
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes(':1234')) return 'lmstudio';
  if (url.includes('openrouter.ai')) {
    if (opus.includes('gemma')) return 'openrouter-free';
    if (opus.includes('gemini')) return 'openrouter-gemini';
    if (opus.includes('openai') || opus.includes('o3') || opus.includes('gpt')) return 'openrouter-gpt';
    if (opus.includes('stepfun')) return 'openrouter-stepfun';
    if (opus.includes('hunter')) return 'openrouter-hunter';
    if (opus.includes('nemotron')) return 'openrouter-nemotron';
    return 'openrouter';
  }
  return 'claude';
}

// ── commands ───────────────────────────────────────────────────────────────

function status() {
  const settings = readJson(SETTINGS_PATH);
  const config   = readJson(CONFIG_PATH);
  const mode     = currentMode(settings);

  if (mode === 'glm51') {
    console.log('Active mode: GLM-5.1 (z.ai)');
    console.log('  Base URL : ' + settings.env.ANTHROPIC_BASE_URL);
    console.log('  Opus     : ' + (settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL   || 'glm-5.1'));
    console.log('  Sonnet   : ' + (settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-5.1'));
    console.log('  Haiku    : ' + (settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL  || 'glm-5.1'));
  } else if (mode === 'glm5turbo') {
    console.log('Active mode: GLM-5-Turbo (z.ai)');
    console.log('  Base URL : ' + settings.env.ANTHROPIC_BASE_URL);
    console.log('  Opus     : ' + (settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL   || 'glm-5-turbo'));
    console.log('  Sonnet   : ' + (settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-5-turbo'));
    console.log('  Haiku    : ' + (settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL  || 'glm-5-turbo'));
  } else if (mode === 'glm5') {
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
  } else if (mode.startsWith('openrouter')) {
    const tierNames = {
      'openrouter': 'Claude',
      'openrouter-free': 'Free (Gemma)',
      'openrouter-gemini': 'Gemini',
      'openrouter-gpt': 'GPT',
      'openrouter-stepfun': 'StepFun',
      'openrouter-hunter': 'Hunter',
      'openrouter-nemotron': 'Nemotron',
    };
    console.log('Active mode: OpenRouter (' + (tierNames[mode] || 'Claude') + ')');
    console.log('  Base URL : ' + settings.env.ANTHROPIC_BASE_URL);
    const k = settings.env.ANTHROPIC_AUTH_TOKEN || '';
    if (k) console.log('  API key  : ' + k.slice(0, 8) + '...' + k.slice(-4));
    else console.log('  API key  : (none)');
    console.log('  Opus     : ' + (settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL   || OPENROUTER_DEFAULT_MODELS.ANTHROPIC_DEFAULT_OPUS_MODEL));
    console.log('  Sonnet   : ' + (settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL || OPENROUTER_DEFAULT_MODELS.ANTHROPIC_DEFAULT_SONNET_MODEL));
    console.log('  Haiku    : ' + (settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL  || OPENROUTER_DEFAULT_MODELS.ANTHROPIC_DEFAULT_HAIKU_MODEL));
  } else {
    console.log('Active mode: Claude (native)');
  }

  if (config.glmApiKey) {
    const k = config.glmApiKey;
    console.log('  GLM key  : ' + k.slice(0, 8) + '...' + k.slice(-4));
  } else if (mode === 'glm' || mode === 'glm5' || mode === 'glm51' || mode === 'glm5turbo') {
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

  // clear any GLM-5 variants, LM Studio, and OpenRouter keys before switching
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of GLM51_KEYS) delete settings.env[k];
  for (const k of GLM5_TURBO_KEYS) delete settings.env[k];
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

  // clear any other GLM mode, LM Studio, and OpenRouter keys before switching
  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of GLM51_KEYS) delete settings.env[k];
  for (const k of GLM5_TURBO_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];
  for (const k of OPENROUTER_KEYS) delete settings.env[k];

  settings.env.ANTHROPIC_AUTH_TOKEN = key;
  Object.assign(settings.env, GLM5_ENV);

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to GLM-5 (z.ai). Restart Claude Code to apply.');
}

function useGlm51() {
  const config = readJson(CONFIG_PATH);
  const key    = config.glmApiKey;

  if (!key) {
    console.error('No API key saved. Run first:\n  gcl-switcher set-key <your_z.ai_api_key>');
    process.exit(1);
  }

  const settings = readJson(SETTINGS_PATH);
  settings.env   = settings.env ?? {};

  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of GLM5_TURBO_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];
  for (const k of OPENROUTER_KEYS) delete settings.env[k];

  settings.env.ANTHROPIC_AUTH_TOKEN = key;
  Object.assign(settings.env, GLM51_ENV);

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to GLM-5.1 (z.ai). Restart Claude Code to apply.');
}

function useGlm5Turbo() {
  const config = readJson(CONFIG_PATH);
  const key    = config.glmApiKey;

  if (!key) {
    console.error('No API key saved. Run first:\n  gcl-switcher set-key <your_z.ai_api_key>');
    process.exit(1);
  }

  const settings = readJson(SETTINGS_PATH);
  settings.env   = settings.env ?? {};

  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of GLM51_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];
  for (const k of OPENROUTER_KEYS) delete settings.env[k];

  settings.env.ANTHROPIC_AUTH_TOKEN = key;
  Object.assign(settings.env, GLM5_TURBO_ENV);

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to GLM-5-Turbo (z.ai). Restart Claude Code to apply.');
}

function useLmStudio() {
  const settings = readJson(SETTINGS_PATH);
  settings.env = settings.env ?? {};

  // clear GLM modes and OpenRouter keys when enabling LM Studio
  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of GLM51_KEYS) delete settings.env[k];
  for (const k of GLM5_TURBO_KEYS) delete settings.env[k];
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
  for (const k of GLM51_KEYS) delete settings.env[k];
  for (const k of GLM5_TURBO_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];
  for (const k of OPENROUTER_KEYS) delete settings.env[k];

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to Claude (native). Restart Claude Code to apply.');
}

function useStepfun() {
  useOpenRouter('stepfun');
}

function useNemotron() {
  useOpenRouter('nemotron');
}

function useOpenRouter(tier = 'default') {
  const config = readJson(CONFIG_PATH);
  const key    = config.openrouterApiKey;

  if (!key) {
    console.error('No OpenRouter API key saved. Run first:\n  gcl-switcher set-openrouter-key <your_openrouter_api_key>');
    process.exit(1);
  }

  const settings = readJson(SETTINGS_PATH);
  settings.env   = settings.env ?? {};

  // clear GLM modes and LM Studio keys before switching
  for (const k of GLM_KEYS) delete settings.env[k];
  for (const k of GLM5_KEYS) delete settings.env[k];
  for (const k of GLM51_KEYS) delete settings.env[k];
  for (const k of GLM5_TURBO_KEYS) delete settings.env[k];
  for (const k of LM_STUDIO_KEYS) delete settings.env[k];

  settings.env.ANTHROPIC_AUTH_TOKEN = key;
  Object.assign(settings.env, OPENROUTER_ENV);

  // Select models based on tier
  const tierModels = {
    'free': OPENROUTER_FREE_MODELS,
    'gemini': OPENROUTER_GEMINI_MODELS,
    'gpt': OPENROUTER_GPT_MODELS,
    'stepfun': OPENROUTER_STEPFUN_MODELS,
    'hunter': OPENROUTER_HUNTER_MODELS,
    'nemotron': OPENROUTER_NEMOTRON_MODELS,
  };

  if (tierModels[tier]) {
    Object.assign(settings.env, tierModels[tier]);
  } else if (config.openrouterModels) {
    Object.assign(settings.env, config.openrouterModels);
  } else {
    Object.assign(settings.env, OPENROUTER_DEFAULT_MODELS);
  }

  writeJson(SETTINGS_PATH, settings);
  const tierName = tier === 'default' ? '' : ' (' + tier + ')';
  console.log('Switched to OpenRouter' + tierName + '. Restart Claude Code to apply.');
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

function setOpenRouterModels(tier, model) {
  if (!tier || !model) {
    console.error('Usage: gcl-switcher set-openrouter-models <opus|sonnet|haiku> <model_id>');
    console.error('');
    console.error('Examples:');
    console.error('  gcl-switcher set-openrouter-models opus anthropic/claude-opus-4-20250514');
    console.error('  gcl-switcher set-openrouter-models sonnet anthropic/claude-sonnet-4-20250514');
    console.error('  gcl-switcher set-openrouter-models haiku anthropic/claude-3-5-haiku-20241022');
    process.exit(1);
  }

  const validTiers = ['opus', 'sonnet', 'haiku'];
  if (!validTiers.includes(tier)) {
    console.error('Invalid tier. Must be one of: opus, sonnet, haiku');
    process.exit(1);
  }

  const config = readJson(CONFIG_PATH);
  config.openrouterModels = config.openrouterModels || {};

  const envKey = 'ANTHROPIC_DEFAULT_' + tier.toUpperCase() + '_MODEL';
  config.openrouterModels[envKey] = model;

  writeJson(CONFIG_PATH, config);
  console.log('OpenRouter ' + tier + ' model set to: ' + model);
  console.log('Run "gcl-switcher use openrouter" to apply.');
}

function help() {
  console.log([
    '',
    'gcl-switcher  —  switch Claude Code between GLM, OpenRouter, LM Studio, and native Claude',
    '',
    'Usage:',
    '  gcl-switcher status                      Show active mode and settings',
    '  gcl-switcher use glm                     Switch to GLM (z.ai)',
    '  gcl-switcher use glm51                   Switch to GLM-5.1 (latest for all GLM plans)',
    '  gcl-switcher use glm5                    Switch to GLM-5 (coding optimized)',
    '  gcl-switcher use glm5turbo               Switch to GLM-5-Turbo (fast high-end)',
    '  gcl-switcher use openrouter [tier]       Switch to OpenRouter (claude|free|gemini|gpt|stepfun|hunter|nemotron)',
    '  gcl-switcher use stepfun                 Switch to StepFun (shortcut)',
    '  gcl-switcher use nemotron                Switch to Nemotron (shortcut)',
    '  gcl-switcher use lmstudio                Switch to LM Studio (local)',
    '  gcl-switcher use claude                  Switch to native Claude',
    '  gcl-switcher set-key <api_key>           Save your z.ai API key',
    '  gcl-switcher set-openrouter-key <key>    Save your OpenRouter API key',
    '  gcl-switcher set-openrouter-models <tier> <model>  Set custom model',
    '  gcl-switcher help                        Show this help',
    '',
    'Quickstart (GLM):',
    '  gcl-switcher set-key sk-xxxxxxx          # save key once',
    '  gcl-switcher use glm51                   # activate GLM-5.1 (best default on z.ai)',
    '  gcl-switcher use glm5                    # activate GLM-5 (best for coding)',
    '  gcl-switcher use glm5turbo               # activate GLM-5-Turbo',
    '',
    'Quickstart (OpenRouter):',
    '  gcl-switcher set-openrouter-key sk-or-xx  # save key once',
    '  gcl-switcher use openrouter               # Claude models (default)',
    '  gcl-switcher use openrouter free          # Free models (Gemma)',
    '  gcl-switcher use openrouter gemini        # Google Gemini',
    '  gcl-switcher use openrouter gpt           # OpenAI GPT',
    '  gcl-switcher use stepfun                  # StepFun (shortcut)',
    '  gcl-switcher use nemotron                 # Nemotron (shortcut)',
    '  gcl-switcher use openrouter hunter        # Hunter Alpha',
    '',
    '  gcl-switcher use claude                  # go back to native Claude',
    '',
    'GLM Coding Features:',
    '  - GLM-5.1 available on all GLM Coding plans',
    '  - GLM-5-Turbo for faster premium runs',
    '  - 200K context, 128K max output',
    '  - Extended timeout (5min) for long code gen',
    '',
    'OpenRouter Tiers:',
    '  claude   - Anthropic Claude (default)',
    '  free     - Google Gemma (free tier)',
    '  gemini   - Google Gemini 2.5',
    '  gpt      - OpenAI GPT-4o / o3-mini',
    '  stepfun  - StepFun Generation',
    '  hunter   - OpenRouter Hunter Alpha',
    '  nemotron - Nvidia Nemotron 3 Super',
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

const [,, cmd, sub, arg3] = process.argv;

switch (cmd) {
  case 'status':
    status();
    break;

  case 'use':
    if (sub === 'glm')             useGlm();
    else if (sub === 'glm51')      useGlm51();
    else if (sub === 'glm5')       useGlm5();
    else if (sub === 'glm5turbo')  useGlm5Turbo();
    else if (sub === 'openrouter') useOpenRouter(arg3);
    else if (sub === 'stepfun')    useStepfun();
    else if (sub === 'nemotron')   useNemotron();
    else if (sub === 'lmstudio') useLmStudio();
    else if (sub === 'claude')    useClaude();
    else { console.error('Usage: gcl-switcher use <glm|glm51|glm5|glm5turbo|openrouter [tier]|stepfun|lmstudio|claude>'); process.exit(1); }
    break;

  case 'set-key':
    setKey(sub);
    break;

  case 'set-openrouter-key':
    setOpenRouterKey(sub);
    break;

  case 'set-openrouter-models':
    setOpenRouterModels(sub, arg3);
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
