import assert from 'assert';
import { evaluateCondition, buildResponseSchema } from '../lib/validation';
import { Clue } from '../lib/schemas';

/**
 * Sanitizes CSV cell to prevent CSV Formula Injection in Excel/Sheets.
 */
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@]/.test(strVal)) {
    strVal = `'${strVal}`;
  }
  const escaped = strVal.replace(/"/g, '""');
  return `"${escaped}"`;
}

function runTests() {
  console.log('🧪 Running FormFlow Unit & Security Audit Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     ${error.message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Suite 1: Conditional Logic Engine (evaluateCondition)
  // -------------------------------------------------------------
  console.log('--- Suite 1: Conditional Logic Engine ---');

  test('equals operator matches exact string case-insensitively', () => {
    const cond = { fieldId: 'c1', operator: 'equals' as const, value: 'Yes' };
    assert.strictEqual(evaluateCondition(cond, { c1: 'Yes' }), true);
    assert.strictEqual(evaluateCondition(cond, { c1: 'yes' }), true);
    assert.strictEqual(evaluateCondition(cond, { c1: 'No' }), false);
  });

  test('contains operator matches substrings correctly', () => {
    const cond = { fieldId: 'c1', operator: 'contains' as const, value: 'murder' };
    assert.strictEqual(evaluateCondition(cond, { c1: 'Investigation into murder at Pier 42' }), true);
    assert.strictEqual(evaluateCondition(cond, { c1: 'Simple theft incident' }), false);
  });

  test('greater_than operator compares numeric values', () => {
    const cond = { fieldId: 'c1', operator: 'greater_than' as const, value: '5' };
    assert.strictEqual(evaluateCondition(cond, { c1: 10 }), true);
    assert.strictEqual(evaluateCondition(cond, { c1: '8' }), true);
    assert.strictEqual(evaluateCondition(cond, { c1: 3 }), false);
  });

  test('is_empty operator detects empty / undefined answers', () => {
    const cond = { fieldId: 'c1', operator: 'is_empty' as const, value: '' };
    assert.strictEqual(evaluateCondition(cond, { c1: '' }), true);
    assert.strictEqual(evaluateCondition(cond, { c1: undefined }), true);
    assert.strictEqual(evaluateCondition(cond, { c1: 'filled' }), false);
  });

  // -------------------------------------------------------------
  // Test Suite 2: Dynamic Zod Response Validation Schema
  // -------------------------------------------------------------
  console.log('\n--- Suite 2: Dynamic Response Schema Builder ---');

  const sampleClues: Clue[] = [
    {
      id: 'c_email',
      type: 'email',
      label: 'Witness Email',
      required: true,
      pageIndex: 0,
      options: [],
      helpText: '',
      placeholder: '',
    },
    {
      id: 'c_rating',
      type: 'rating',
      label: 'Rating Scale',
      required: true,
      validation: { max: 5 },
      pageIndex: 0,
      options: [],
      helpText: '',
      placeholder: '',
    },
  ];

  test('validates valid response payload against schema', () => {
    const schema = buildResponseSchema(sampleClues);
    const result = schema.safeParse({
      c_email: 'detective@noir.com',
      c_rating: 4,
    });
    assert.strictEqual(result.success, true);
  });

  test('rejects invalid email address in response', () => {
    const schema = buildResponseSchema(sampleClues);
    const result = schema.safeParse({
      c_email: 'invalid-email-string',
      c_rating: 4,
    });
    assert.strictEqual(result.success, false);
  });

  // -------------------------------------------------------------
  // Test Suite 3: CSV Formula Injection Defense
  // -------------------------------------------------------------
  console.log('\n--- Suite 3: CSV Formula Injection Defense ---');

  test('prefixes formula triggers =, +, -, @ with single quote', () => {
    assert.strictEqual(sanitizeCsvCell('=SUM(A1:A10)'), '"\'=SUM(A1:A10)"');
    assert.strictEqual(sanitizeCsvCell('+12345'), '"\'+12345"');
    assert.strictEqual(sanitizeCsvCell('-500'), '"\'-500"');
    assert.strictEqual(sanitizeCsvCell('@cmd'), '"\'@cmd"');
  });

  test('formats standard text safely in CSV cell', () => {
    assert.strictEqual(sanitizeCsvCell('Detective Spade'), '"Detective Spade"');
    assert.strictEqual(sanitizeCsvCell('He said "No"'), '"He said ""No"""');
  });

  console.log(`\n=================================================`);
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`=================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
