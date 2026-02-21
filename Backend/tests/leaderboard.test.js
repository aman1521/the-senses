import { computeTier } from './helpers.js';

test('tier ladder increases', ()=>{
  expect(computeTier(0)).toBe('Thinker');
  expect(computeTier(80)).toBe('Visionary');
});
