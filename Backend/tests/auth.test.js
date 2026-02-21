import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth.routes.js';

const app = express(); app.use(express.json()); app.use('/api/auth', authRoutes);

test('OTP login returns token', async ()=>{
  const res = await request(app).post('/api/auth/otp').send({ email:'test@example.com', name:'Test' });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy();
});
