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

const { startBridge } = require('./src/bridge');
const commands = require('./src/commands');

const [,, cmd, sub, arg3] = process.argv;

switch (cmd) {
  case 'status':
    commands.status();
    break;

  case 'use':
    if (sub === 'glm' || sub === 'glm47') commands.useGlmVariant('glm47');
    else if (sub === 'glm51')      commands.useGlmVariant('glm51');
    else if (sub === 'glm5')       commands.useGlmVariant('glm5');
    else if (sub === 'glm5turbo')  commands.useGlmVariant('glm5turbo');
    else if (sub === 'openrouter') commands.useOpenRouter(arg3);
    else if (['stepfun', 'nemotron', 'minimax', 'arcee', 'elephant', 'ling', 'ring', 'tencent', 'owl'].includes(sub)) {
      commands.useOpenRouter(sub);
    }
    else if (sub === 'lmstudio')   commands.useLmStudio();
    else if (sub === 'dflash')     commands.useDflash();
    else if (sub === 'kimi')       commands.useKimi();
    else if (sub === 'kimi-bridge') commands.useKimi(true);
    else if (sub === 'mimo')       commands.useMimo(arg3);
    else if (sub === 'omniroute')  commands.useOmniroute();
    else if (sub === 'claude')     commands.useClaude();
    else {
      console.error('Usage: gcl-switcher use <glm|glm51|glm5|glm5turbo|openrouter [tier]|stepfun|nemotron|minimax|arcee|elephant|ling|ring|tencent|owl|lmstudio|dflash|kimi|mimo|omniroute|claude>');
      process.exit(1);
    }
    break;

  case 'set-key':
    commands.setKey(sub);
    break;

  case 'get-key':
    commands.getKey();
    break;

  case 'bridge':
    startBridge();
    break;

  case 'set-openrouter-key':
    commands.setOpenRouterKey(sub);
    break;

  case 'set-nvidia-key':
    commands.setNvidiaKey(sub);
    break;

  case 'set-kimi-model':
    commands.setProviderModel('kimi', sub);
    break;

  case 'set-kimi-url':
    commands.setProviderUrl('kimi', sub);
    break;

  case 'reset-kimi':
    commands.resetProvider('kimi');
    break;

  case 'set-mimo-key':
    commands.setMimoKey(sub);
    break;

  case 'set-mimo-model':
    commands.setProviderModel('mimo', sub);
    break;

  case 'set-mimo-url':
    commands.setProviderUrl('mimo', sub);
    break;

  case 'reset-mimo':
    commands.resetProvider('mimo');
    break;

  case 'set-omniroute-key':
    commands.setOmnirouteKey(sub);
    break;

  case 'set-omniroute-model':
    commands.setProviderModel('omniroute', sub);
    break;

  case 'set-omniroute-url':
    commands.setProviderUrl('omniroute', sub);
    break;

  case 'reset-omniroute':
    commands.resetProvider('omniroute');
    break;

  case 'set-openrouter-models':
    commands.setOpenRouterModels(sub, arg3);
    break;

  case 'set-dflash-model':
    commands.setProviderModel('dflash', sub);
    break;

  case 'set-dflash-url':
    commands.setProviderUrl('dflash', sub);
    break;

  case 'help':
  case '--help':
  case '-h':
  case undefined:
    commands.help();
    break;

  default:
    console.error(`Unknown command: ${cmd}`);
    commands.help();
    process.exit(1);
}
