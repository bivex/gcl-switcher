/**
 * Local bridge server for NVIDIA Kimi.
 */

'use strict';

const http = require('http');
const https = require('https');
const { readJson } = require('./utils');
const { CONFIG_PATH } = require('./constants');

function startBridge() {
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

module.exports = {
  startBridge
};
