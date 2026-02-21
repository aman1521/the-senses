export const TIERS = [
  { name:'Thinker', min:0 },
  { name:'Analyst', min:20 },
  { name:'Strategist', min:40 },
  { name:'Innovator', min:60 },
  { name:'Visionary', min:80 }
];
export const computeTier = (score)=> TIERS.slice().reverse().find(t=>score>=t.min).name;
