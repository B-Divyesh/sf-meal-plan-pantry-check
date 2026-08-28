import type { ConsolidatedIngredient, ParsedIngredient, Recipe } from './types';

const FRACTIONS: Record<string, number> = {
  '¼': .25, '½': .5, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875,
};

const UNIT_ALIASES: Record<string, string> = {
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  cup: 'cup', cups: 'cup', c: 'cup',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  can: 'can', cans: 'can', tin: 'can', tins: 'can',
  jar: 'jar', jars: 'jar', bunch: 'bunch', bunches: 'bunch',
  clove: 'clove', cloves: 'clove', slice: 'slice', slices: 'slice',
  piece: 'piece', pieces: 'piece', packet: 'packet', packets: 'packet',
};

const TO_BASE: Record<string, { family: string; factor: number }> = {
  tsp: { family: 'volume', factor: 5 }, tbsp: { family: 'volume', factor: 15 }, cup: { family: 'volume', factor: 240 },
  ml: { family: 'volume', factor: 1 }, l: { family: 'volume', factor: 1000 },
  g: { family: 'mass', factor: 1 }, kg: { family: 'mass', factor: 1000 }, oz: { family: 'mass', factor: 28.3495 }, lb: { family: 'mass', factor: 453.592 },
};

export function parseNumber(token: string): number | null {
  const clean = token.trim().replace(',', '.');
  if (!clean) return null;
  if (FRACTIONS[clean] !== undefined) return FRACTIONS[clean];
  const mixedUnicode = clean.match(/^(\d+)([¼½¾⅓⅔⅛⅜⅝⅞])$/);
  if (mixedUnicode) return Number(mixedUnicode[1]) + FRACTIONS[mixedUnicode[2]];
  const fraction = clean.match(/^(\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2])) return Number(fraction[1]) / Number(fraction[2]);
  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

function cleanName(value: string): string {
  return value.replace(/^of\s+/i, '').replace(/\s+/g, ' ').replace(/^[,–—-]+\s*|\s*[,;]+$/g, '').trim();
}

export function parseIngredient(raw: string, index = 0): ParsedIngredient {
  const line = raw.replace(/^[-*•]\s*/, '').trim();
  const parts = line.split(/\s+/);
  let quantity = parseNumber(parts[0] ?? '');
  let consumed = quantity === null ? 0 : 1;

  if (quantity !== null && parts[1] && parseNumber(parts[1]) !== null && /^\d+\/\d+$/.test(parts[1])) {
    quantity += parseNumber(parts[1]) ?? 0;
    consumed = 2;
  }

  const unitToken = (parts[consumed] ?? '').toLowerCase().replace(/[.,]$/, '');
  const unit = UNIT_ALIASES[unitToken] ?? (quantity !== null ? 'each' : '');
  if (UNIT_ALIASES[unitToken]) consumed += 1;
  const name = cleanName(parts.slice(consumed).join(' ')) || cleanName(line) || 'Unnamed ingredient';
  const uncertain = quantity === null || !name || /\b(to taste|as needed|optional|some)\b/i.test(line);
  const note = quantity === null ? 'No quantity found—confirm the amount.' : uncertain ? 'Amount needs a quick check.' : undefined;

  return { id: `line-${index}`, raw: line, quantity, unit, name, uncertain, note };
}

export function parseIngredients(text: string): ParsedIngredient[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(parseIngredient);
}

function normalizedName(name: string): string {
  return name.toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(fresh|chopped|diced|minced|sliced|finely|roughly|divided)\b/g, '')
    .replace(/\s+/g, ' ').replace(/[,;]$/g, '').trim();
}

function amountText(value: number | null): string {
  if (value === null) return 'Amount needed';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
}

function displayAmount(quantity: number | null, unit: string): { quantity: number | null; unit: string; text: string } {
  if (quantity === null) return { quantity, unit, text: 'Amount needed' };
  let value = quantity;
  let displayUnit = unit;
  if (unit === 'ml' && value >= 1000) { value /= 1000; displayUnit = 'l'; }
  if (unit === 'g' && value >= 1000) { value /= 1000; displayUnit = 'kg'; }
  return { quantity: value, unit: displayUnit, text: amountText(value) };
}

export function groceryGroup(name: string): string {
  const n = name.toLowerCase();
  if (/apple|banana|lemon|lime|onion|garlic|potato|tomato|carrot|pepper|spinach|lettuce|herb|parsley|cilantro|ginger|broccoli|mushroom/.test(n)) return 'Produce';
  if (/milk|cream|cheese|yogurt|butter|egg/.test(n)) return 'Dairy & eggs';
  if (/chicken|beef|pork|fish|salmon|turkey|sausage|bacon/.test(n)) return 'Meat & fish';
  if (/bread|tortilla|pita|roll|bagel/.test(n)) return 'Bakery';
  if (/frozen|ice cream/.test(n)) return 'Frozen';
  if (/flour|sugar|salt|oil|vinegar|rice|pasta|bean|lentil|spice|paprika|cumin|stock|broth|can|chocolate|oat/.test(n)) return 'Pantry';
  return 'Other';
}

export function consolidate(recipes: Recipe[]): ConsolidatedIngredient[] {
  const map = new Map<string, ConsolidatedIngredient>();
  recipes.filter((recipe) => recipe.selected).forEach((recipe) => {
    const scale = recipe.targetServings / recipe.baseServings;
    recipe.ingredients.forEach((ingredient) => {
      const conversion = TO_BASE[ingredient.unit];
      const unit = conversion ? (conversion.family === 'volume' ? 'ml' : 'g') : ingredient.unit;
      const scaled = ingredient.quantity === null ? null : ingredient.quantity * scale * (conversion?.factor ?? 1);
      const key = `${normalizedName(ingredient.name)}|${unit}`;
      const current = map.get(key);
      const contributionAmount = displayAmount(scaled, unit);
      const contribution = {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        sourceUrl: recipe.sourceUrl,
        quantity: contributionAmount.quantity,
        displayQuantity: `${contributionAmount.text}${contributionAmount.unit && contributionAmount.quantity !== null ? ` ${contributionAmount.unit}` : ''}`,
      };
      if (current) {
        current.quantity = current.quantity === null || scaled === null ? null : current.quantity + scaled;
        current.uncertain ||= ingredient.uncertain;
        if (ingredient.note) current.notes.push(ingredient.note);
        current.contributions.push(contribution);
      } else {
        map.set(key, {
          key, name: ingredient.name, quantity: scaled, displayQuantity: '', unit,
          uncertain: ingredient.uncertain, notes: ingredient.note ? [ingredient.note] : [],
          group: groceryGroup(ingredient.name), contributions: [contribution],
        });
      }
    });
  });
  return [...map.values()].map((item) => {
    const display = displayAmount(item.quantity, item.unit);
    return { ...item, quantity: display.quantity, displayQuantity: display.text, unit: display.unit };
  }).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}
