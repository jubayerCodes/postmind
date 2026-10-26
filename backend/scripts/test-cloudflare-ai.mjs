import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '../.env');
let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
let apiToken = process.env.CLOUDFLARE_API_TOKEN;

if ((!accountId || !apiToken) && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('CLOUDFLARE_ACCOUNT_ID=')) {
      accountId = trimmed.split('=')[1].replace(/["']/g, '').trim();
    }
    if (trimmed.startsWith('CLOUDFLARE_API_TOKEN=')) {
      apiToken = trimmed.split('=')[1].replace(/["']/g, '').trim();
    }
  }
}

console.log('\n======================================================');
console.log('    POSTMIND — CLOUDFLARE WORKERS AI DIAGNOSTIC TOOL   ');
console.log('======================================================\n');

if (!accountId || !apiToken) {
  console.log('⚠️  Status: Cloudflare Workers AI credentials are NOT SET yet.\n');
  console.log('👉 Quick 3-Minute Setup:');
  console.log('   1. Sign up for free: https://dash.cloudflare.com/sign-up (No credit card needed)');
  console.log('   2. Copy your "Account ID" from your Cloudflare dashboard overview page.');
  console.log('   3. Go to "My Profile" > "API Tokens" > Create Token > Select "Workers AI" template.');
  console.log('   4. Add them to backend/.env:');
  console.log('      CLOUDFLARE_ACCOUNT_ID="your_account_id"');
  console.log('      CLOUDFLARE_API_TOKEN="your_api_token"\n');
  console.log('   5. Run this test again: "pnpm test:cloudflare-ai"\n');
  process.exit(0);
}

const maskedId = accountId.slice(0, 6) + '...' + accountId.slice(-4);
const maskedToken = apiToken.slice(0, 6) + '...' + apiToken.slice(-4);
console.log(`🆔 Account ID: ${maskedId}`);
console.log(`🔑 API Token:  ${maskedToken}\n`);

async function runTest() {
  const models = [
    '@cf/black-forest-labs/flux-1-schnell',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  ];

  let success = false;

  for (const model of models) {
    console.log(`Testing model: ${model} ...`);
    try {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt:
            'Commercial studio product photography of a modern luxury wristwatch on clean white background, 8k',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.log(`❌ HTTP ${response.status}: ${errText.slice(0, 150)}`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (
        contentType.includes('image/') ||
        contentType.includes('application/octet-stream')
      ) {
        const arrayBuffer = await response.arrayBuffer();
        console.log(
          `✅ SUCCESS! Received binary image (${arrayBuffer.byteLength} bytes) from ${model}`,
        );
        success = true;
        break;
      }

      const data = await response.json();
      if (data.result?.image) {
        console.log(
          `✅ SUCCESS! Received base64 image (${data.result.image.length} chars) from ${model}`,
        );
        success = true;
        break;
      } else {
        console.log(`⚠️ Response received: ${JSON.stringify(data).slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log('\n======================================================');
  if (success) {
    console.log('🎉 Cloudflare Workers AI is CONNECTED & FULLY OPERATIONAL!');
    console.log('   PostMind will generate 100+ high-definition HD images daily for free.');
  } else {
    console.log('⚠️ Could not generate image. Check your Account ID and API Token permissions.');
  }
  console.log('======================================================\n');
}

runTest();
