/**
 * CLI Command implementations.
 */

'use strict';

const { readJson, writeJson, currentMode } = require('./utils');
const {
  SETTINGS_PATH,
  CONFIG_PATH,
  UNIQUE_PROVIDER_KEYS,
  GLM_ENV,
  GLM5_ENV,
  GLM51_ENV,
  GLM52_ENV,
  GLM5_TURBO_ENV,
  LM_STUDIO_ENV,
  LM_STUDIO_TOKEN,
  DFLASH_ENV,
  DFLASH_TOKEN,
  KIMI_ENV,
  KIMI_BRIDGE_ENV,
  MIMO_ENV,
  MIMO_TIER_MODELS,
  OMNIROUTE_ENV,
  OPENROUTER_ENV,
  OPENROUTER_DEFAULT_MODELS,
  OPENROUTER_TIER_MODELS,
  OPENMODEL_ENV
} = require('./constants');

/**
 * Generic provider switcher.
 * @param {object} options
 * @param {string} options.name Display name of the provider.
 * @param {object} options.env Environment variables to set.
 * @param {string} [options.token] Auth token to set (optional).
 * @param {string} [options.apiKey] API key to set (optional).
 */
function switchProvider({ name, env, token, apiKey }) {
  const settings = readJson(SETTINGS_PATH);
  settings.env = settings.env ?? {};

  // Clear all known provider keys to avoid conflicts
  for (const k of UNIQUE_PROVIDER_KEYS) {
    delete settings.env[k];
  }

  // Set new environment variables
  Object.assign(settings.env, env);

  if (token) settings.env.ANTHROPIC_AUTH_TOKEN = token;
  if (apiKey) settings.env.ANTHROPIC_API_KEY = apiKey;

  writeJson(SETTINGS_PATH, settings);
  console.log(`Switched to ${name}. Restart Claude Code to apply.`);
}

function status() {
  const settings = readJson(SETTINGS_PATH);
  const config = readJson(CONFIG_PATH);
  const mode = currentMode(settings);

  const displayMap = {
    'glm52': 'GLM-5.2 (z.ai)',
    'glm51': 'GLM-5.1 (z.ai)',
    'glm5turbo': 'GLM-5-Turbo (z.ai)',
    'glm5': 'GLM-5 (z.ai)',
    'glm47': 'GLM-4.7 (z.ai)',
    'lmstudio': 'LM Studio (local)',
    'dflash': 'DFlash (local MLX)',
    'kimi': 'Kimi (NVIDIA)',
    'kimi-bridge': 'Kimi (NVIDIA Bridge)',
    'omniroute': 'Omniroute (local)',
    'mimo': 'MiMo (xiaomimimo.com)',
    'openmodel': 'OpenModel (api.openmodel.ai)',
    'claude': 'Claude (native)'
  };

  if (mode.startsWith('openrouter')) {
    const tierNames = {
      'openrouter': 'Claude',
      'openrouter-free': 'Free (Gemma)',
      'openrouter-gemini': 'Gemini',
      'openrouter-gpt': 'GPT',
      'openrouter-stepfun': 'StepFun',
      'openrouter-hunter': 'Hunter',
      'openrouter-nemotron': 'Nemotron',
      'openrouter-minimax': 'Minimax',
      'openrouter-arcee': 'Arcee',
      'openrouter-elephant': 'Elephant Alpha',
      'openrouter-ling': 'Ling',
      'openrouter-ring': 'Ring',
      'openrouter-tencent': 'Tencent HY3',
      'openrouter-owl': 'Owl Alpha',
    };
    console.log(`Active mode: OpenRouter (${tierNames[mode] || 'Claude'})`);
    console.log(`  Base URL : ${settings.env.ANTHROPIC_BASE_URL}`);
    const k = settings.env.ANTHROPIC_AUTH_TOKEN || '';
    console.log(`  API key  : ${k ? k.slice(0, 8) + '...' + k.slice(-4) : '(none)'}`);
    console.log(`  Opus     : ${settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL || OPENROUTER_DEFAULT_MODELS.ANTHROPIC_DEFAULT_OPUS_MODEL}`);
    console.log(`  Sonnet   : ${settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL || OPENROUTER_DEFAULT_MODELS.ANTHROPIC_DEFAULT_SONNET_MODEL}`);
    console.log(`  Haiku    : ${settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || OPENROUTER_DEFAULT_MODELS.ANTHROPIC_DEFAULT_HAIKU_MODEL}`);
  } else {
    console.log(`Active mode: ${displayMap[mode] || displayMap['claude']}`);
    if (mode !== 'claude') {
      console.log(`  Base URL : ${settings.env.ANTHROPIC_BASE_URL}`);
      if (settings.env.ANTHROPIC_MODEL) console.log(`  Model    : ${settings.env.ANTHROPIC_MODEL}`);
      if (settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL) console.log(`  Opus     : ${settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL}`);
      if (settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL) console.log(`  Sonnet   : ${settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL}`);
      if (settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL) console.log(`  Haiku    : ${settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL}`);
      if (mode === 'lmstudio' && settings.env.ANTHROPIC_AUTH_TOKEN) {
         console.log(`  Token    : ${settings.env.ANTHROPIC_AUTH_TOKEN}`);
      }
      if (mode === 'kimi-bridge') {
         console.log('  Note     : ensure "gcl-switcher bridge" is running');
      }
    }
  }

  const keys = [
    { label: 'GLM key', val: config.glmApiKey },
    { label: 'NVIDIA key', val: config.nvidiaApiKey },
    { label: 'MiMo key', val: config.mimoApiKey },
    { label: 'OpenRouter key', val: config.openrouterApiKey },
    { label: 'Omniroute key', val: config.omnirouteApiKey },
    { label: 'OpenModel key', val: config.openmodelApiKey }
  ];

  for (const k of keys) {
    if (k.val) {
      console.log(`  ${k.label.padEnd(14)}: ${k.val.slice(0, 8)}...${k.val.slice(-4)}`);
    }
  }

  if (['glm47', 'glm5', 'glm51', 'glm52', 'glm5turbo'].includes(mode) && !config.glmApiKey) {
    console.log('  WARNING  : no API key saved — run: gcl-switcher set-key <key>');
  }
  if (mode === 'openmodel' && !config.openmodelApiKey) {
    console.log('  WARNING  : no API key saved — run: gcl-switcher set-openmodel-key <key>');
  }
}

function useGlmVariant(variant) {
  const config = readJson(CONFIG_PATH);
  const key = config.glmApiKey;
  if (!key) {
    console.error('No API key saved. Run first:\n  gcl-switcher set-key <your_z.ai_api_key>');
    process.exit(1);
  }

  const variants = {
    'glm47': { name: 'GLM-4.7 (z.ai)', env: GLM_ENV },
    'glm5': { name: 'GLM-5 (z.ai)', env: GLM5_ENV },
    'glm51': { name: 'GLM-5.1 (z.ai)', env: GLM51_ENV },
    'glm52': { name: 'GLM-5.2 (z.ai)', env: GLM52_ENV },
    'glm5turbo': { name: 'GLM-5-Turbo (z.ai)', env: GLM5_TURBO_ENV }
  };

  const v = variants[variant] || variants['glm47'];
  switchProvider({ ...v, token: key });
}

function useLmStudio() {
  switchProvider({
    name: 'LM Studio (local)',
    env: LM_STUDIO_ENV,
    token: LM_STUDIO_TOKEN
  });
}

function useDflash() {
  const config = readJson(CONFIG_PATH);
  const env = { ...DFLASH_ENV };

  if (config.dflashBaseUrl) env.ANTHROPIC_BASE_URL = config.dflashBaseUrl;
  if (config.dflashModel) {
    env.ANTHROPIC_MODEL = config.dflashModel;
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.dflashModel;
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.dflashModel;
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.dflashModel;
  }

  switchProvider({
    name: 'DFlash (local MLX)',
    env,
    token: DFLASH_TOKEN,
    apiKey: DFLASH_TOKEN
  });

  if (config.dflashBaseUrl) console.log(`Using custom URL: ${config.dflashBaseUrl}`);
  if (config.dflashModel) console.log(`Using custom model: ${config.dflashModel}`);
}

function useKimi(bridge = false) {
  const config = readJson(CONFIG_PATH);
  const key = config.nvidiaApiKey;

  if (!key) {
    console.error(`No NVIDIA API key saved. Run first:\n  gcl-switcher set-nvidia-key <your_nvidia_api_key>`);
    process.exit(1);
  }

  const env = { ...(bridge ? KIMI_BRIDGE_ENV : KIMI_ENV) };

  if (!bridge) {
    if (config.kimiBaseUrl) env.ANTHROPIC_BASE_URL = config.kimiBaseUrl;
    if (config.kimiModel) {
      env.ANTHROPIC_MODEL = config.kimiModel;
      env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.kimiModel;
      env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.kimiModel;
      env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.kimiModel;
    }
  }

  switchProvider({
    name: bridge ? 'Kimi (NVIDIA Bridge)' : 'Kimi (NVIDIA)',
    env,
    token: key,
    apiKey: key
  });

  if (bridge) {
    console.log('Next: keep "gcl-switcher bridge" running in a separate terminal.');
  } else {
    if (config.kimiBaseUrl) console.log(`Using custom URL: ${config.kimiBaseUrl}`);
    if (config.kimiModel) console.log(`Using custom model: ${config.kimiModel}`);
  }
}

function useClaude() {
  const settings = readJson(SETTINGS_PATH);
  if (!settings.env) {
    console.log('Already on Claude (native). Nothing changed.');
    return;
  }

  for (const k of UNIQUE_PROVIDER_KEYS) {
    delete settings.env[k];
  }

  writeJson(SETTINGS_PATH, settings);
  console.log('Switched to Claude (native). Restart Claude Code to apply.');
}

function useOpenRouter(tier = 'default') {
  const config = readJson(CONFIG_PATH);
  const key = config.openrouterApiKey;

  if (!key) {
    console.error('No OpenRouter API key saved. Run first:\n  gcl-switcher set-openrouter-key <your_openrouter_api_key>');
    process.exit(1);
  }

  const env = { ...OPENROUTER_ENV };

  if (OPENROUTER_TIER_MODELS[tier]) {
    Object.assign(env, OPENROUTER_TIER_MODELS[tier]);
  } else if (config.openrouterModels) {
    Object.assign(env, config.openrouterModels);
  } else {
    Object.assign(env, OPENROUTER_DEFAULT_MODELS);
  }

  switchProvider({
    name: `OpenRouter${tier === 'default' ? '' : ' (' + tier + ')'}`,
    env,
    token: key
  });
}

function useMimo(tier = 'v2.5') {
  const config = readJson(CONFIG_PATH);
  const key = config.mimoApiKey;

  if (!key) {
    console.error('No MiMo API key saved. Run first:\n  gcl-switcher set-mimo-key <your_mimo_api_key>');
    process.exit(1);
  }

  const env = { ...MIMO_ENV };
  if (MIMO_TIER_MODELS[tier]) {
    Object.assign(env, MIMO_TIER_MODELS[tier]);
  }

  if (config.mimoBaseUrl) env.ANTHROPIC_BASE_URL = config.mimoBaseUrl;
  if (config.mimoModel) {
    env.ANTHROPIC_MODEL = config.mimoModel;
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.mimoModel;
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.mimoModel;
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.mimoModel;
  }

  switchProvider({
    name: `MiMo (${MIMO_TIER_MODELS[tier] ? tier : 'custom'})`,
    env,
    token: key,
    apiKey: key
  });

  if (config.mimoBaseUrl) console.log(`Using custom URL: ${config.mimoBaseUrl}`);
  if (config.mimoModel) console.log(`Using custom model: ${config.mimoModel}`);
}

function useOmniroute() {
  const config = readJson(CONFIG_PATH);
  const env = { ...OMNIROUTE_ENV };

  if (config.omnirouteBaseUrl) env.ANTHROPIC_BASE_URL = config.omnirouteBaseUrl;
  if (config.omnirouteModel) {
    env.ANTHROPIC_MODEL = config.omnirouteModel;
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.omnirouteModel;
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.omnirouteModel;
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.omnirouteModel;
  }

  const key = config.omnirouteApiKey || 'sk-omniroute';
  switchProvider({
    name: 'Omniroute (local)',
    env,
    token: key
  });

  if (config.omnirouteBaseUrl) console.log(`Using custom URL: ${config.omnirouteBaseUrl}`);
  if (config.omnirouteModel) console.log(`Using custom model: ${config.omnirouteModel}`);
}

function useOpenmodel() {
  const config = readJson(CONFIG_PATH);
  const key = config.openmodelApiKey;

  if (!key) {
    console.error('No OpenModel API key saved. Run first:\n  gcl-switcher set-openmodel-key <your_openmodel_api_key>');
    process.exit(1);
  }

  const env = { ...OPENMODEL_ENV };

  if (config.openmodelBaseUrl) env.ANTHROPIC_BASE_URL = config.openmodelBaseUrl;
  if (config.openmodelModel) {
    env.ANTHROPIC_MODEL = config.openmodelModel;
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.openmodelModel;
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.openmodelModel;
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.openmodelModel;
  }

  switchProvider({
    name: 'OpenModel (Unified AI API Gateway)',
    env,
    token: key,
    apiKey: key
  });

  if (config.openmodelBaseUrl) console.log(`Using custom URL: ${config.openmodelBaseUrl}`);
  if (config.openmodelModel) console.log(`Using custom model: ${config.openmodelModel}`);
}

// ── Setters ────────────────────────────────────────────────────────────────

function setConfigValue(key, value, message) {
  if (!value) {
    console.error(`Usage: gcl-switcher set-${key.replace(/([A-Z])/g, '-$1').toLowerCase()} <value>`);
    process.exit(1);
  }
  const config = readJson(CONFIG_PATH);
  config[key] = value;
  writeJson(CONFIG_PATH, config);
  console.log(message(value));
}

function setKey(key) {
  setConfigValue('glmApiKey', key, v => `GLM API key saved: ${v.slice(0, 8)}...${v.slice(-4)}`);
}

function getKey() {
  const config = readJson(CONFIG_PATH);
  const key = config.glmApiKey;
  if (!key) {
    console.error('No GLM API key saved.');
    process.exit(1);
  }
  console.log(key);
}

function setOpenRouterKey(key) {
  setConfigValue('openrouterApiKey', key, v => `OpenRouter API key saved: ${v.slice(0, 8)}...${v.slice(-4)}`);
}

function setNvidiaKey(key) {
  setConfigValue('nvidiaApiKey', key, v => `NVIDIA API key saved: ${v.slice(0, 8)}...${v.slice(-4)}`);
}

function setMimoKey(key) {
  setConfigValue('mimoApiKey', key, v => `MiMo API key saved: ${v.slice(0, 8)}...${v.slice(-4)}`);
}

function setOmnirouteKey(key) {
  setConfigValue('omnirouteApiKey', key, v => `Omniroute API key saved: ${v.slice(0, 8)}...${v.slice(-4)}`);
}

function setOpenmodelKey(key) {
  setConfigValue('openmodelApiKey', key, v => `OpenModel API key saved: ${v.slice(0, 8)}...${v.slice(-4)}`);
}

function setProviderModel(provider, model) {
  if (!model) {
    console.error(`Usage: gcl-switcher set-${provider}-model <model_id>`);
    process.exit(1);
  }
  const key = `${provider}Model`;
  setConfigValue(key, model, v => `${provider.charAt(0).toUpperCase() + provider.slice(1)} model override set to: ${v}`);
  
  const settings = readJson(SETTINGS_PATH);
  const mode = currentMode(settings);
  if (mode === provider) {
    if (provider === 'kimi') useKimi();
    if (provider === 'mimo') useMimo();
    if (provider === 'omniroute') useOmniroute();
    if (provider === 'dflash') useDflash();
    if (provider === 'openmodel') useOpenmodel();
  }
}

function setProviderUrl(provider, url) {
  if (!url) {
    console.error(`Usage: gcl-switcher set-${provider}-url <url>`);
    process.exit(1);
  }
  const key = `${provider}BaseUrl`;
  setConfigValue(key, url, v => `${provider.charAt(0).toUpperCase() + provider.slice(1)} Base URL set to: ${v}`);
  
  const settings = readJson(SETTINGS_PATH);
  const mode = currentMode(settings);
  if (mode === provider) {
    if (provider === 'kimi') useKimi();
    if (provider === 'mimo') useMimo();
    if (provider === 'omniroute') useOmniroute();
    if (provider === 'dflash') useDflash();
    if (provider === 'openmodel') useOpenmodel();
  }
}

function resetProvider(provider) {
  const config = readJson(CONFIG_PATH);
  delete config[`${provider}BaseUrl`];
  delete config[`${provider}Model`];
  writeJson(CONFIG_PATH, config);
  console.log(`${provider.charAt(0).toUpperCase() + provider.slice(1)} overrides cleared. Using defaults.`);
  
  const settings = readJson(SETTINGS_PATH);
  const mode = currentMode(settings);
  if (mode === provider) {
    if (provider === 'kimi') useKimi();
    if (provider === 'mimo') useMimo();
    if (provider === 'omniroute') useOmniroute();
    if (provider === 'dflash') useDflash();
    if (provider === 'openmodel') useOpenmodel();
  }
}

function setOpenRouterModels(tier, model) {
  if (!tier || !model) {
    console.error('Usage: gcl-switcher set-openrouter-models <opus|sonnet|haiku> <model_id>');
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
  console.log(`OpenRouter ${tier} model set to: ${model}`);
  console.log('Run "gcl-switcher use openrouter" to apply.');
}

function help() {
  console.log([
    '',
    'gcl-switcher  —  switch Claude Code between GLM, OpenRouter, LM Studio, and native Claude',
    '',
    'Usage:',
    '  gcl-switcher status                      Show active mode and settings',
    '  gcl-switcher use glm                     Switch to GLM-4.7 (z.ai)',
    '  gcl-switcher use glm47                   Switch to GLM-4.7 (alias)',
    '  gcl-switcher use glm51                   Switch to GLM-5.1 (latest for all GLM plans)',
    '  gcl-switcher use glm52                   Switch to GLM-5.2 (latest GLM release)',
    '  gcl-switcher use glm5                    Switch to GLM-5 (coding optimized)',
    '  gcl-switcher use glm5turbo               Switch to GLM-5-Turbo (fast high-end)',
    '  gcl-switcher use openrouter [tier]       Switch to OpenRouter (claude|free|gemini|gpt|stepfun|hunter|nemotron|elephant|ling|ring|tencent|owl)',
    '  gcl-switcher use stepfun                 Switch to StepFun (shortcut)',
    '  gcl-switcher use nemotron                Switch to Nemotron (shortcut)',
    '  gcl-switcher use minimax                 Switch to Minimax (shortcut)',
    '  gcl-switcher use arcee                   Switch to Arcee (shortcut)',
    '  gcl-switcher use elephant                Switch to Elephant Alpha (shortcut)',
    '  gcl-switcher use ling                    Switch to Ling 2.6 Flash (shortcut)',
    '  gcl-switcher use ring                    Switch to Ring 2.6 (shortcut)',
    '  gcl-switcher use tencent                 Switch to Tencent HY3 Preview (shortcut)',
    '  gcl-switcher use owl                     Switch to Owl Alpha (shortcut)',
    '  gcl-switcher use lmstudio                Switch to LM Studio (local:1234)',
    '  gcl-switcher use dflash                  Switch to DFlash (local:8000 mlx)',
    '  gcl-switcher use kimi                    Switch to Kimi (NVIDIA direct)',
    '  gcl-switcher use kimi-bridge             Switch to Kimi (NVIDIA Bridge)',
    '  gcl-switcher use mimo [v2.5|v2|flash]    Switch to MiMo (xiaomimimo.com)',
    '  gcl-switcher use omniroute               Switch to Omniroute (local:20128)',
    '  gcl-switcher use openmodel               Switch to OpenModel (api.openmodel.ai)',
    '  gcl-switcher bridge                      Start local Kimi bridge server',
    '  gcl-switcher use claude                  Switch to native Claude',
    '  gcl-switcher set-key <api_key>           Save your z.ai API key',
    '  gcl-switcher get-key                     Print your saved z.ai API key',
    '  gcl-switcher set-openrouter-key <key>    Save your OpenRouter API key',
    '  gcl-switcher set-nvidia-key <key>        Save your NVIDIA API key',
    '  gcl-switcher set-mimo-key <key>          Save your MiMo API key',
    '  gcl-switcher set-omniroute-key <key>     Save your Omniroute API key',
    '  gcl-switcher set-openmodel-key <key>     Save your OpenModel API key',
    '  gcl-switcher set-openrouter-models <tier> <model>  Set custom model',
    '  gcl-switcher set-dflash-model <model_id> Set custom DFlash model',
    '  gcl-switcher set-dflash-url <url>        Set custom DFlash URL',
    '  gcl-switcher set-kimi-model <model_id>   Set custom Kimi model',
    '  gcl-switcher set-kimi-url <url>          Set custom Kimi URL',
    '  gcl-switcher reset-kimi                  Reset Kimi to defaults',
    '  gcl-switcher set-mimo-model <model_id>   Set custom MiMo model',
    '  gcl-switcher set-mimo-url <url>          Set custom MiMo URL',
    '  gcl-switcher reset-mimo                  Reset MiMo to defaults',
    '  gcl-switcher set-omniroute-model <model> Set custom Omniroute model',
    '  gcl-switcher set-omniroute-url <url>     Set custom Omniroute URL',
    '  gcl-switcher reset-omniroute             Reset Omniroute to defaults',
    '  gcl-switcher set-openmodel-model <model> Set custom OpenModel model',
    '  gcl-switcher set-openmodel-url <url>     Set custom OpenModel URL',
    '  gcl-switcher reset-openmodel             Reset OpenModel to defaults',
    '  gcl-switcher help                        Show this help',
    '',
    'Quickstart (GLM):',
    '  gcl-switcher set-key sk-xxxxxxx          # save key once',
    '  gcl-switcher use glm51                   # activate GLM-5.1 (best default on z.ai)',
    '  gcl-switcher use glm52                   # activate GLM-5.2 (latest)',
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
    '  gcl-switcher use minimax                  # Minimax (shortcut)',
    '  gcl-switcher use arcee                    # Arcee (shortcut)',
    '  gcl-switcher use elephant                 # Elephant Alpha (shortcut)',
    '  gcl-switcher use ling                     # Ling 2.6 Flash (shortcut)',
    '  gcl-switcher use ring                     # Ring 2.6 (shortcut)',
    '  gcl-switcher use tencent                  # Tencent HY3 Preview (shortcut)',
    '  gcl-switcher use owl                      # Owl Alpha (shortcut)',
    '  gcl-switcher use openrouter hunter        # Hunter Alpha',
    '',
    'Quickstart (OpenModel):',
    '  gcl-switcher set-openmodel-key om_xxxxxx  # save key once',
    '  gcl-switcher use openmodel                # activate OpenModel',
    '',
    '  gcl-switcher use claude                  # go back to native Claude',
    '',
    'Quickstart (Omniroute):',
    '  gcl-switcher set-omniroute-key sk-xxx     # save key once',
    '  gcl-switcher use omniroute                # activate Omniroute',
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
    '  minimax  - Minimax M2.5',
    '  arcee    - Arcee Trinity',
    '  elephant - Elephant Alpha (free)',
    '  ling     - InclusionAI Ling 2.6 Flash (free)',
    '  ring     - InclusionAI Ring 2.6 (free)',
    '  tencent  - Tencent HY3 Preview (free)',
    '  owl      - Owl Alpha',
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

module.exports = {
  status,
  useGlmVariant,
  useLmStudio,
  useDflash,
  useKimi,
  useClaude,
  useOpenRouter,
  useMimo,
  useOmniroute,
  useOpenmodel,
  setKey,
  getKey,
  setOpenRouterKey,
  setNvidiaKey,
  setMimoKey,
  setOmnirouteKey,
  setOpenmodelKey,
  setProviderModel,
  setProviderUrl,
  resetProvider,
  setOpenRouterModels,
  help
};
