/**
 * Local bridge server for NVIDIA Kimi.
 */

'use strict';

const http = require('http');
const https = require('https');
const { readJson, currentMode } = require('./utils');
const { CONFIG_PATH, SETTINGS_PATH } = require('./constants');

function startKimiBridge() {
  const config = readJson(CONFIG_PATH);
  const key = config.nvidiaApiKey;
  if (!key) {
    console.error('No NVIDIA key saved.');
    process.exit(1);
  }

  console.log('Starting NVIDIA Kimi Bridge...');
  console.log('Listening on http://127.0.0.1:8080');
  console.log('Target: https://integrate.api.nvidia.com/v1/chat/completions');

  const server = http.createServer((req, res) => {
    if (req.url !== '/v1/messages') {
      res.writeHead(404);
      return res.end();
    }

    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const anthropic = JSON.parse(body);
        const openai = {
          model: 'moonshotai/kimi-k2.5',
          messages: anthropic.messages.map(m => ({
            role: m.role,
            content: Array.isArray(m.content) ? m.content.map(c => c.text).join('\n') : m.content
          })),
          stream: anthropic.stream,
          max_tokens: anthropic.max_tokens,
          temperature: anthropic.temperature,
          chat_template_kwargs: { thinking: true }
        };

        const options = {
          hostname: 'integrate.api.nvidia.com',
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        };

        const nvidiaReq = https.request(options, (nvidiaRes) => {
          if (anthropic.stream) {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            });

            nvidiaRes.on('data', (chunk) => {
              const str = chunk.toString();
              const lines = str.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6);
                  if (dataStr === '[DONE]') {
                    res.write('event: message_stop\ndata: {"type": "message_stop"}\n\n');
                    continue;
                  }
                  try {
                    const data = JSON.parse(dataStr);
                    const content = data.choices[0].delta.content;
                    if (content) {
                      const payload = {
                        type: 'content_block_delta',
                        index: 0,
                        delta: { type: 'text_delta', text: content }
                      };
                      res.write(`event: content_block_delta\ndata: ${JSON.stringify(payload)}\n\n`);
                    }
                  } catch (e) {}
                }
              }
            });
            nvidiaRes.on('end', () => res.end());
          } else {
            let resBody = '';
            nvidiaRes.on('data', chunk => (resBody += chunk));
            nvidiaRes.on('end', () => {
              try {
                const openResponse = JSON.parse(resBody);
                const anthropicResponse = {
                  id: openResponse.id,
                  type: 'message',
                  role: 'assistant',
                  model: openResponse.model,
                  content: [{ type: 'text', text: openResponse.choices[0].message.content }],
                  usage: {
                    input_tokens: openResponse.usage.prompt_tokens,
                    output_tokens: openResponse.usage.completion_tokens
                  }
                };
                res.end(JSON.stringify(anthropicResponse));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to parse NVIDIA response' }));
              }
            });
          }
        });

        nvidiaReq.on('error', (e) => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        });

        nvidiaReq.write(JSON.stringify(openai));
        nvidiaReq.end();
      } catch (e) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid Anthropic request' }));
      }
    });
  });

  server.listen(8080, '127.0.0.1');
}

function startOpenmodelBridge() {
  const config = readJson(CONFIG_PATH);
  const key = config.openmodelApiKey;
  if (!key) {
    console.error('No OpenModel key saved. Run first:\n  gcl-switcher set-openmodel-key <key>');
    process.exit(1);
  }

  console.log('Starting OpenModel Bridge...');
  console.log('Listening on http://127.0.0.1:8082');
  console.log('Target: https://api.openmodel.ai');

  const server = http.createServer((req, res) => {
    // 1. Handle Retrieve Model request: GET /v1/models/{model_id}
    const modelMatch = req.url.match(/^\/v1\/models\/(.+)$/);
    if (req.method === 'GET' && modelMatch) {
      let modelId = decodeURIComponent(modelMatch[1]);
      // Normalize modelId (strip [1m], [1M], etc.)
      modelId = modelId.replace(/\[1[mM]\]?$/, '');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: modelId,
        type: 'model',
        display_name: modelId,
        created_at: '2024-10-22T00:00:00Z'
      }));
      return;
    }

    // 2. Handle List Models request: GET /v1/models
    if (req.method === 'GET' && req.url === '/v1/models') {
      const options = {
        hostname: 'api.openmodel.ai',
        path: '/v1/models',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`
        }
      };
      const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', (e) => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      });
      proxyReq.end();
      return;
    }

    // 3. Handle Messages request: POST /v1/messages
    if (req.method === 'POST' && req.url === '/v1/messages') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        try {
          const anthropic = JSON.parse(body);
          // Normalize model (strip [1m], [1M], etc.)
          if (anthropic.model) {
            anthropic.model = anthropic.model.replace(/\[1[mM]\]?$/, '');
          }

          const options = {
            hostname: 'api.openmodel.ai',
            path: '/v1/messages',
            method: 'POST',
            headers: {
              'x-api-key': key,
              'Content-Type': 'application/json',
              'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
            }
          };

          const proxyReq = https.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
          });

          proxyReq.on('error', (e) => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
          });

          proxyReq.write(JSON.stringify(anthropic));
          proxyReq.end();
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid request JSON' }));
        }
      });
      return;
    }

    // Fallback
    res.writeHead(404);
    res.end();
  });

  server.listen(8082, '127.0.0.1');
}

function startBridge() {
  const settings = readJson(SETTINGS_PATH);
  const mode = currentMode(settings);

  if (mode === 'openmodel-bridge' || mode === 'openmodel') {
    startOpenmodelBridge();
  } else {
    startKimiBridge();
  }
}

module.exports = {
  startBridge
};
