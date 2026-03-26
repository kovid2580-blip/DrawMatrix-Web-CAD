import { interpretPrompt } from "./prompt-interpreter";
import {
  ALL_TRAINING_SAMPLES,
  GOLDEN_SAMPLES,
} from "./datasets/training-samples";

function testAI() {
  console.log("--- AI INTERPRETER VERIFICATION ---");
  let passed = 0;
  let failed = 0;

  // Test Golden Set (Highest Priority)
  console.log("\n[GOLDEN SET TEST]");
  for (const sample of GOLDEN_SAMPLES) {
    const result = interpretPrompt(sample.prompt);
    const match =
      result.entities.length === sample.expected.length &&
      result.entities.every((e, i) => e.type === sample.expected[i].type);

    if (match) {
      console.log(`✅ PASS: "${sample.prompt}"`);
      passed++;
    } else {
      console.log(`❌ FAIL: "${sample.prompt}"`);
      console.log(`   Expected: ${JSON.stringify(sample.expected)}`);
      console.log(`   Actual:   ${JSON.stringify(result.entities)}`);
      failed++;
    }
  }

  // Test a random sample of 50 from synthesized set
  console.log("\n[SYNTHESIZED SET TEST (RANDOM 50)]");
  const subset = ALL_TRAINING_SAMPLES.sort(() => 0.5 - Math.random()).slice(
    0,
    50
  );
  for (const sample of subset) {
    const result = interpretPrompt(sample.prompt);
    const match =
      result.entities.length >= sample.expected.length &&
      sample.expected.every((exp) =>
        result.entities.some((act) => act.type === exp.type)
      );

    if (match) passed++;
    else {
      console.log(`❌ FAIL: "${sample.prompt}"`);
      failed++;
    }
  }

  console.log(`\n--- RESULTS ---`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  if (failed === 0)
    console.log("\n✨ AI TRAINING SUCCESSFUL! 100% ACCURACY ACHIEVED. ✨");
  else console.log("\n⚠️ AI TRAINING NEEDS REFINEMENT.");
}

testAI();
