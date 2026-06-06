/**
 * Batch test script: Call pixie.autoContext for all conversation scenarios
 * from pasted_content.txt and collect Lumi's reactions.
 */
import fs from 'fs';

const API_URL = 'http://localhost:3000/api/trpc/pixie.autoContext';

// Read and parse scenarios
const raw = fs.readFileSync('/home/ubuntu/upload/pasted_content.txt', 'utf-8');
const scenarios = raw.split('---').map(s => s.trim()).filter(Boolean);

console.log(`Total scenarios: ${scenarios.length}\n`);

// Parse a scenario into chatContext array
function parseScenario(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const name = match[1];
      const content = match[2];
      return {
        senderName: name,
        senderType: 'human',
        content: content
      };
    }
    return null;
  }).filter(Boolean);
}

// Call autoContext API
async function callAutoContext(chatContext, scenarioIndex) {
  const body = {
    json: {
      roomId: `test-room-${scenarioIndex}`,
      userId: 'JiaYi',
      pixieId: 'lumi',
      persona: 'sassy_roast_bestie',
      chatContext: chatContext
    }
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.result?.data?.json) {
      return data.result.data.json;
    } else if (data.error) {
      return { error: data.error.message || JSON.stringify(data.error) };
    }
    return { error: 'Unknown response format', raw: JSON.stringify(data).slice(0, 200) };
  } catch (err) {
    return { error: err.message };
  }
}

// Run all tests sequentially (to avoid rate limiting)
async function runAll() {
  const results = [];
  
  for (let i = 0; i < scenarios.length; i++) {
    const chatContext = parseScenario(scenarios[i]);
    const lastMsg = chatContext[chatContext.length - 1];
    const preview = scenarios[i].split('\n').filter(l => l.trim()).slice(0, 2).join(' | ');
    
    console.log(`[${i + 1}/${scenarios.length}] Testing: ${preview.slice(0, 60)}...`);
    
    const result = await callAutoContext(chatContext, i + 1);
    
    results.push({
      index: i + 1,
      preview: scenarios[i].split('\n').filter(l => l.trim()).join(' → ').slice(0, 100),
      lastSpeaker: lastMsg?.senderName,
      lastMessage: lastMsg?.content,
      shouldSpeak: result.shouldSpeak,
      visibility: result.visibility,
      interventionType: result.interventionType,
      reason: result.reason,
      message: result.message,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      suggestedNextAction: result.suggestedNextAction,
      cooldownTurns: result.cooldownTurns,
      error: result.error
    });
    
    // Brief status
    if (result.shouldSpeak) {
      console.log(`  → 🗣️ SPEAK [${result.interventionType}] risk:${result.riskLevel} "${(result.message || '').slice(0, 50)}"`);
    } else {
      console.log(`  → 🤫 SILENT [${result.reason?.slice(0, 40)}]`);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Save results to JSON
  fs.writeFileSync('/home/ubuntu/pixie-api/test-results.json', JSON.stringify(results, null, 2));
  
  // Print summary
  const speaking = results.filter(r => r.shouldSpeak);
  const silent = results.filter(r => !r.shouldSpeak && !r.error);
  const errors = results.filter(r => r.error);
  
  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${results.length} scenarios tested`);
  console.log(`  🗣️ Lumi speaks: ${speaking.length}`);
  console.log(`  🤫 Lumi silent: ${silent.length}`);
  console.log(`  ❌ Errors: ${errors.length}`);
  console.log('='.repeat(60));
  
  if (speaking.length > 0) {
    console.log('\n📢 Scenarios where Lumi speaks:');
    speaking.forEach(r => {
      console.log(`\n  [#${r.index}] ${r.preview.slice(0, 80)}`);
      console.log(`    Type: ${r.interventionType} | Risk: ${r.riskLevel} | Confidence: ${r.confidence}`);
      console.log(`    Message: ${r.message}`);
    });
  }
  
  console.log('\nResults saved to test-results.json');
}

runAll().catch(console.error);
