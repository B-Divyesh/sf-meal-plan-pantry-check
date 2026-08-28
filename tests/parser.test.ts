import { describe, expect, it } from 'vitest';
import { consolidate, parseIngredient, parseIngredients, parseNumber } from '../src/parser';
import type { Recipe } from '../src/types';

describe('ingredient parsing', () => {
  it('reads decimals, fractions, mixed fractions, and unicode fractions', () => {
    expect(parseNumber('1.5')).toBe(1.5);
    expect(parseNumber('1/2')).toBe(.5);
    expect(parseNumber('2½')).toBe(2.5);
    expect(parseIngredient('1 1/2 cups rice').quantity).toBe(1.5);
  });

  it('normalizes simple units while keeping the source line', () => {
    expect(parseIngredient('2 tablespoons olive oil')).toMatchObject({
      raw: '2 tablespoons olive oil', quantity: 2, unit: 'tbsp', name: 'olive oil', uncertain: false,
    });
  });

  it('exposes uncertain amounts instead of inventing them', () => {
    const line = parseIngredient('salt to taste');
    expect(line.quantity).toBeNull();
    expect(line.uncertain).toBe(true);
    expect(line.note).toContain('No quantity');
  });

  it('ignores blank lines', () => {
    expect(parseIngredients('1 onion\n\n2 cloves garlic\n')).toHaveLength(2);
  });
});

describe('deterministic consolidation', () => {
  const recipe = (id: string, title: string, servings: number, target: number, lines: string): Recipe => ({
    id, title, baseServings: servings, targetServings: target, sourceUrl: `https://example.com/${id}`,
    ingredientsText: lines, ingredients: parseIngredients(lines), selected: true, updatedAt: 1,
  });

  it('scales recipes and merges compatible units with source arithmetic', () => {
    const result = consolidate([
      recipe('a', 'Soup', 4, 8, '1 cup stock'),
      recipe('b', 'Rice', 2, 2, '250 ml stock'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'stock', quantity: 730, unit: 'ml', uncertain: false });
    expect(result[0].contributions).toHaveLength(2);
    expect(result[0].contributions[0].displayQuantity).toBe('480 ml');
  });

  it('does not merge unlike units', () => {
    const result = consolidate([recipe('a', 'Sauce', 4, 4, '1 can tomatoes\n200 g tomatoes')]);
    expect(result).toHaveLength(2);
  });

  it('skips recipes not selected for this plan', () => {
    const excluded = recipe('a', 'Soup', 4, 4, '1 onion');
    excluded.selected = false;
    expect(consolidate([excluded])).toEqual([]);
  });
});
