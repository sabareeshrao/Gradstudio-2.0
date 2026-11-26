import assert from 'node:assert/strict';
import test from 'node:test';
import { selectAppearanceScope } from '../scripts/select-appearance-scope.mjs';

test('simulation-only changes select the smallest stable-ID set', () => {
  assert.deepEqual(selectAppearanceScope([
    'content/simulations/sim-z/index.html',
    'content/simulations/sim-a/simulation.json',
    'content/simulations/sim-z/styles.css'
  ]), { scope: 'changed', ids: ['sim-a', 'sim-z'] });
});

test('hierarchy-only metadata changes do not retest unchanged lesson documents', () => {
  assert.deepEqual(selectAppearanceScope([
    'content/categories/cat-new/category.json',
    'content/courses/course-new/course.json',
    'content/sections/section-new/section.json'
  ]), { scope: 'none', ids: [] });
});

test('shared assets and validation code fail closed to the full library', () => {
  assert.deepEqual(selectAppearanceScope(['content/shared/theme/asset.json']), { scope: 'full', ids: [] });
  assert.deepEqual(selectAppearanceScope(['scripts/verify-appearance.mjs']), { scope: 'full', ids: [] });
});
