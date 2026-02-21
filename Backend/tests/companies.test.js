// simple shape test (no DB wired in unit mode)
import { toCSV } from '../src/utils/csv.js';

test('CSV export produces header row', ()=>{
  const csv = toCSV([{a:1,b:'x'}]);
  expect(csv.split('\n')[0]).toBe('a,b');
});
