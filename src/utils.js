/**
 * Helper utilities for file I/O and state management.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Reads and parses a JSON file.
 * @param {string} p Path to the JSON file.
 * @returns {object} Parsed JSON data or an empty object on error.
 */
function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Writes data to a JSON file, creating parent directories if needed.
 * @param {string} p Path to the JSON file.
 * @param {object} data Data to write.
 */
function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Determines the current mode based on Claude Code settings.
 * @param {object} settings Claude Code settings object.
 * @returns {string} The detected mode string.
 */
function currentMode(settings) {
  const url = settings?.env?.ANTHROPIC_BASE_URL ?? '';
  const opus = settings?.env?.ANTHROPIC_DEFAULT_OPUS_MODEL ?? '';

  if (url.includes('z.ai')) {
    if (opus === 'glm-5.2') return 'glm52';
    if (opus === 'glm-5.1') return 'glm51';
    if (opus === 'glm-5-turbo') return 'glm5turbo';
    if (opus === 'glm-5') return 'glm5';
    if (opus === 'glm-4.7' || opus.includes('glm-4')) return 'glm47';
    return 'glm47';
  }

  if (url.includes('nvidia.com') || (opus && opus.includes('kimi'))) {
    if (url.includes('127.0.0.1:8080') || url.includes('localhost:8080')) return 'kimi-bridge';
    return 'kimi';
  }

  if (url.includes('localhost:8000') || url.includes('127.0.0.1:8000')) return 'dflash';
  if (url.includes(':20128') || url.includes('omniroute')) return 'omniroute';
  if (url.includes('xiaomimimo.com')) return 'mimo';
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes(':1234')) return 'lmstudio';

  if (url.includes('openrouter.ai')) {
    if (opus.includes('gemma')) return 'openrouter-free';
    if (opus.includes('gemini')) return 'openrouter-gemini';
    if (opus.includes('openai') || opus.includes('o3') || opus.includes('gpt')) return 'openrouter-gpt';
    if (opus.includes('stepfun')) return 'openrouter-stepfun';
    if (opus.includes('hunter')) return 'openrouter-hunter';
    if (opus.includes('nemotron')) return 'openrouter-nemotron';
    if (opus.includes('minimax')) return 'openrouter-minimax';
    if (opus.includes('arcee')) return 'openrouter-arcee';
    if (opus.includes('elephant')) return 'openrouter-elephant';
    if (opus.includes('ling')) return 'openrouter-ling';
    if (opus.includes('ring')) return 'openrouter-ring';
    if (opus.includes('tencent') || opus.includes('hy3')) return 'openrouter-tencent';
    if (opus.includes('owl')) return 'openrouter-owl';
    return 'openrouter';
  }

  return 'claude';
}

module.exports = {
  readJson,
  writeJson,
  currentMode
};
