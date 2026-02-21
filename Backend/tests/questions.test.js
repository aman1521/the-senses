import { paginate } from '../src/utils/paginate.js';
test('paginate clamps values', ()=>{
  const p = paginate({ page:-5, limit:9999 });
  expect(p.page).toBe(1);
  expect(p.limit).toBeLessThanOrEqual(200);
});
