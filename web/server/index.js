'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const port = process.env.PORT || 4000;
const region = process.env.AWS_REGION || 'us-east-1';
const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
const systemPrompt = process.env.SYSTEM_PROMPT || 'És um assistente útil em português. Responde de forma concisa.';
const maxTokens = Number(process.env.BEDROCK_MAX_TOKENS || 256);

// The SDK uses standard AWS credentials from environment or shared config.
const client = new BedrockRuntimeClient({ region });

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
  const message = (req.body && req.body.message) || '';
  if (!message) {
    return res.status(400).json({ error: 'O campo "message" é obrigatório.' });
  }

  try {
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: message }
          ]
        }
      ]
    };

    // Use AWS SDK with SigV4 credentials (from env, shared config or IAM role)
    const body = JSON.stringify(requestBody);
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body
    });
    const response = await client.send(command);
    const responseText = Buffer.from(response.body).toString('utf-8');
    const responseJson = JSON.parse(responseText);

    let reply = 'Sem resposta.';
    if (responseJson && Array.isArray(responseJson.content)) {
      const textPart = responseJson.content.find(p => p.type === 'text');
      if (textPart && textPart.text) reply = textPart.text;
    } else if (responseJson.completion) {
      reply = responseJson.completion;
    } else if (responseJson.outputText) {
      reply = responseJson.outputText;
    }

    return res.json({ reply });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Bedrock] Invocation error:', err);
    const message = err && err.message ? err.message : 'Erro ao invocar o Bedrock';
    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server disponível em http://localhost:${port}`);
});


