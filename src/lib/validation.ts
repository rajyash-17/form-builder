import { z } from 'zod';
import { Clue, ClueConditional } from './schemas';

export function evaluateCondition(
  condition: ClueConditional | undefined,
  answers: Record<string, unknown>
): boolean {
  if (!condition || !condition.fieldId) return true;

  const rawVal = answers[condition.fieldId];
  const targetVal = (condition.value || '').trim();
  const operator = condition.operator;

  const isEmpty =
    rawVal === undefined ||
    rawVal === null ||
    rawVal === '' ||
    (Array.isArray(rawVal) && rawVal.length === 0);

  if (operator === 'is_empty') return isEmpty;
  if (operator === 'is_not_empty') return !isEmpty;

  if (isEmpty) return false;

  const valStr = Array.isArray(rawVal) ? rawVal.join(', ') : String(rawVal);

  switch (operator) {
    case 'equals':
      if (Array.isArray(rawVal)) {
        return rawVal.map(String).includes(targetVal);
      }
      return valStr.trim().toLowerCase() === targetVal.toLowerCase();

    case 'not_equals':
    case 'notEquals':
      if (Array.isArray(rawVal)) {
        return !rawVal.map(String).includes(targetVal);
      }
      return valStr.trim().toLowerCase() !== targetVal.toLowerCase();

    case 'contains':
      return valStr.toLowerCase().includes(targetVal.toLowerCase());

    case 'greater_than': {
      const numVal = Number(rawVal);
      const targetNum = Number(targetVal);
      return !isNaN(numVal) && !isNaN(targetNum) && numVal > targetNum;
    }

    case 'less_than': {
      const numVal = Number(rawVal);
      const targetNum = Number(targetVal);
      return !isNaN(numVal) && !isNaN(targetNum) && numVal < targetNum;
    }

    default:
      return true;
  }
}

export function buildResponseSchema(clues: Clue[], answers?: Record<string, unknown>) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const clue of clues) {
    if (clue.type === 'statement' || clue.type === 'pageBreak') continue;

    // Check if hidden by condition
    if (answers && clue.showIf && !evaluateCondition(clue.showIf, answers)) {
      // Hidden field is optional and accepts any value or undefined
      shape[clue.id] = z.any().optional();
      continue;
    }

    let fieldSchema: z.ZodTypeAny;

    switch (clue.type) {
      case 'email': {
        let s = z.string();
        if (clue.required) {
          s = s.min(1, `The clue "${clue.label}" requires a valid detective email.`);
        }
        fieldSchema = s.email(`Invalid email format for clue "${clue.label}".`);
        break;
      }

      case 'number': {
        const numSchema = z.preprocess(
          (val) => (val === '' || val === undefined ? undefined : Number(val)),
          z.number({ invalid_type_error: `"${clue.label}" must be a valid number.` })
        );

        let s: z.ZodTypeAny = numSchema;

        if (clue.validation?.min !== undefined) {
          const min = clue.validation.min;
          s = (s as z.ZodNumber).min(min, `Value for "${clue.label}" must be at least ${min}.`);
        }
        if (clue.validation?.max !== undefined) {
          const max = clue.validation.max;
          s = (s as z.ZodNumber).max(max, `Value for "${clue.label}" must not exceed ${max}.`);
        }
        fieldSchema = s;
        break;
      }

      case 'url': {
        let s = z.string();
        if (clue.required) {
          s = s.min(1, `The clue "${clue.label}" requires a valid URL link.`);
        }
        fieldSchema = s.url(`Invalid web URL format for clue "${clue.label}".`);
        break;
      }

      case 'checkboxes': {
        let s = z.array(z.string());
        if (clue.required) {
          s = s.min(1, `Select at least one option for clue "${clue.label}".`);
        }
        fieldSchema = s;
        break;
      }

      case 'rating': {
        const maxRating = Math.min(Math.max(clue.validation?.max || 5, 3), 10);
        fieldSchema = z.preprocess(
          (val) => Number(val),
          z.number().min(1, `Rating required for "${clue.label}".`).max(maxRating, `Max rating is ${maxRating}.`)
        );
        break;
      }

      case 'linearScale': {
        const minVal = clue.validation?.min ?? 1;
        const maxVal = clue.validation?.max ?? 5;
        fieldSchema = z.preprocess(
          (val) => Number(val),
          z.number().min(minVal, `Scale minimum is ${minVal}.`).max(maxVal, `Scale maximum is ${maxVal}.`)
        );
        break;
      }

      default: {
        let s = z.string();
        if (clue.required) {
          s = s.min(1, `The clue "${clue.label}" is required by bureau regulations.`);
        }
        if (clue.validation?.min !== undefined) {
          const min = clue.validation.min;
          s = s.min(min, `"${clue.label}" must be at least ${min} characters long.`);
        }
        if (clue.validation?.max !== undefined) {
          const max = clue.validation.max;
          s = s.max(max, `"${clue.label}" must not exceed ${max} characters.`);
        }
        fieldSchema = s;
        break;
      }
    }

    if (!clue.required) {
      fieldSchema = fieldSchema.optional().or(z.literal(''));
    }

    shape[clue.id] = fieldSchema;
  }

  return z.object(shape);
}
