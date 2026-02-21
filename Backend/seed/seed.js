import mongoose from 'mongoose';
import { Question } from '../src/models/Question.js';
import { User } from '../src/models/User.js';
import { Company } from '../src/models/Company.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/senses';

async function run(){
  await mongoose.connect(MONGO_URI);
  console.log('Seeding…');

  await Question.deleteMany({});
  await User.deleteMany({});
  await Company.deleteMany({});

  const q = [
    { text:'Largest planet?', answer:'jupiter', industry:'general', level:1, approved:true },
    { text:'What is Big-O of binary search?', answer:'o(log n)', industry:'it', level:1, approved:true },
    { text:'Define ROAS formula', answer:'revenue over ad spend', industry:'marketing', level:2, approved:true },
    { text:'NPV is positive. Implication?', answer:'accept project', industry:'finance', level:1, approved:true },
  ];
  await Question.insertMany(q);
  console.log('Inserted questions:', q.length);

  process.exit(0);
}
run().catch(e=>{ console.error(e); process.exit(1); });
