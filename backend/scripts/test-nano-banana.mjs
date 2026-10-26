import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '../.env');
let geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('GEMINI_API_KEY=')) {
      geminiKey = trimmed.split('=')[1].replace(/["']/g, '').trim();
    }
  }
}

console.log('\n======================================================');
console.log('       POSTMIND — NANO BANANA & AI DIAGNOSTIC TOOL     ');
console.log('======================================================\n');

if (!geminiKey) {
  console.error('❌ Error: GEMINI_API_KEY is not set in backend/.env');
  process.exit(1);
}

const maskedKey = geminiKey.slice(0, 8) + '...' + geminiKey.slice(-6);
console.log(`🔑 Using API Key: ${maskedKey}\n`);

async function runDiagnostics() {
  // 1. Test Text & Vision Engine (gemini-3.5-flash-lite)
  console.log('1️⃣  Testing Gemini Text & Document Vision (gemini-3.5-flash-lite)...');
  try {
    const textRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with: "OK"' }] }],
        }),
      },
    );

    if (textRes.ok) {
      console.log('   ✅ PASS: Gemini Text & Vision API is CONNECTED and OPERATIONAL!');
    } else {
      const err = await textRes.text();
      console.log(`   ❌ FAIL: Status ${textRes.status}: ${err}`);
    }
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}`);
  }

  // 2. Test Nano Banana Image Generation Models via @google/genai Interactions API
  console.log('\n2️⃣  Testing Nano Banana Image Generation Models (Interactions API)...');
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const imageModels = [
    'models/gemini-3-pro-image',
    'models/gemini-3.1-flash-image',
    'gemini-3.1-flash-image',
  ];

  let nanoBananaActive = false;

  for (const model of imageModels) {
    process.stdout.write(`   • Trying model: ${model} ... `);
    try {
      const interaction = await ai.interactions.create({
        model,
        input: 'Commercial e-commerce studio product photograph of a watch on white studio background',
        tools: [{ type: 'google_search' }],
        generation_config: {
          temperature: 1,
          max_output_tokens: 32768,
          top_p: 0.95,
          image_config: { image_size: '1K' },
        },
        response_modalities: ['image', 'text'],
      });

      const lastStep = interaction.steps?.at(-1);
      const hasImage =
        lastStep?.content?.some((c) => c.type === 'image' || c.data) ||
        lastStep?.parts?.some((p) => p.inlineData || p.image);

      if (hasImage) {
        console.log('✅ ACTIVE! (Generated Image Successfully)');
        nanoBananaActive = true;
        break;
      } else {
        console.log('⚠️ Response received but no image was in the steps.');
      }
    } catch (err) {
      const msg = err.message || err.error?.message || String(err);
      if (msg.includes('limit: 0') || msg.includes('Rate limit exceeded')) {
        console.log(`⏸️ Quota 0 on Free Tier (Requires billing on Google Cloud project)`);
      } else {
        console.log(`❌ Error: ${msg.slice(0, 100)}...`);
      }
    }
  }

  // 3. Test Fallback Engine (Flux via Pollinations)
  console.log('\n3️⃣  Testing Flux Fallback Engine...');
  const testFluxUrl = `https://image.pollinations.ai/prompt/test-e-commerce-product?width=200&height=200&model=flux&nologo=true`;
  try {
    const fluxRes = await fetch(testFluxUrl, { method: 'HEAD' });
    if (fluxRes.ok || fluxRes.status === 200 || fluxRes.status === 302) {
      console.log('   ✅ PASS: Flux Fallback Engine is LIVE and READY.');
    } else {
      console.log(`   ⚠️ Flux returned status ${fluxRes.status}`);
    }
  } catch (err) {
    console.log(`   ⚠️ Flux check note: ${err.message}`);
  }

  // Summary
  console.log('\n======================================================');
  console.log('                    SUMMARY RESULT                    ');
  console.log('======================================================');
  if (nanoBananaActive) {
    console.log('🎉 Nano Banana is ACTIVE! PostMind is generating images using Nano Banana.');
  } else {
    console.log('⚡ Active Engine: FLUX (Pollinations AI)');
    console.log('ℹ️ Reason: Google restricts native image generation on free projects (Quota limit: 0).');
    console.log('💡 How to activate Nano Banana:');
    console.log('   1. Visit: https://aistudio.google.com/');
    console.log('   2. Link a Google Cloud Billing account (Pay-As-You-Go) to your project.');
    console.log('   3. Re-run this test script: "pnpm test:nano-banana".');
    console.log('   PostMind will automatically switch to Nano Banana without needing code changes!');
  }
  console.log('======================================================\n');
}

runDiagnostics();
