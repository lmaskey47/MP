import { Router } from 'express';
import { z } from 'zod';
import { MobileService, mobileOperation } from '../services/mobile.service';
import { AuthService } from '../services/auth.service';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/asyncHandler';
import { live } from '../services/live.service';

export const mobileRoutes = Router();
const service = new MobileService();
const auth = new AuthService();
mobileRoutes.post('/auth/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(32) }).parse(req.body);
  res.json(await auth.refresh(refreshToken));
}));
mobileRoutes.post('/auth/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(32) }).parse(req.body);
  await auth.logout(refreshToken); res.status(204).end();
}));
mobileRoutes.use('/mobile', new AuthMiddleware().authenticate);
mobileRoutes.get('/mobile/bootstrap', asyncHandler(async (req, res) => { res.json(await service.bootstrap(req.auth!)); }));
mobileRoutes.post('/mobile/operations', asyncHandler(async (req, res) => {
  res.json(await service.apply(mobileOperation.parse(req.body), req.auth!));
}));
mobileRoutes.get('/mobile/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  const send = () => res.write('data: {"type":"refresh"}\n\n');
  send();
  live.on('change', send);
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);
  // Re-authenticate periodically rather than retaining an expired connection forever.
  const expiry = setTimeout(() => res.end(), 5 * 60000);
  res.on('close', () => { clearInterval(heartbeat); clearTimeout(expiry); live.off('change', send); });
});
