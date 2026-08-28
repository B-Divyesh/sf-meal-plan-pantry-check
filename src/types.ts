export type ParsedIngredient = {
  id: string;
  raw: string;
  quantity: number | null;
  unit: string;
  name: string;
  uncertain: boolean;
  note?: string;
};

export type Recipe = {
  id: string;
  title: string;
  baseServings: number;
  targetServings: number;
  sourceUrl: string;
  ingredientsText: string;
  ingredients: ParsedIngredient[];
  selected: boolean;
  updatedAt: number;
};

export type PantryMark = { inPantry: boolean; checked: boolean; updatedAt: number };

export type AppState = {
  version: 1;
  recipes: Recipe[];
  pantry: Record<string, PantryMark>;
  view: 'recipes' | 'pantry' | 'list';
  updatedAt: number;
};

export type Contribution = {
  recipeId: string;
  recipeTitle: string;
  sourceUrl: string;
  quantity: number | null;
  displayQuantity: string;
};

export type ConsolidatedIngredient = {
  key: string;
  name: string;
  quantity: number | null;
  displayQuantity: string;
  unit: string;
  uncertain: boolean;
  notes: string[];
  group: string;
  contributions: Contribution[];
};
