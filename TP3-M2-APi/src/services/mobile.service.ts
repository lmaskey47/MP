import { z } from 'zod';
import { MobileRepository } from '../repositories/mobile.repository';
import { HttpError } from '../utils/httpError';
import type { JwtPayload } from '../utils/jwt';
import { Schemas } from '../validators/schemas';

export const mobileOperation = z.object({ id: z.string().min(8).max(150), kind: z.enum(['item', 'task', 'delivery', 'anomaly']), entityId: z.string().regex(/^[a-f0-9]{24}$/i), expected: z.string().datetime(), action: z.string(), data: z.record(z.string(), z.unknown()) });
export type MobileOperation = z.infer<typeof mobileOperation>;
export const isManager = (auth: JwtPayload) => ['admin', 'logistic_manager'].includes(auth.role);

export class MobileService {
  constructor(private readonly repo = new MobileRepository()) {}
  bootstrap(auth: JwtPayload) { return this.repo.bootstrap(auth.sub, auth.eventIds, isManager(auth)); }
  async apply(op: MobileOperation, auth: JwtPayload) {
    const current = await this.repo.entity(op.kind === 'anomaly' ? 'item' : op.kind, op.entityId);
    if (!current) throw new HttpError(404, 'Ressource introuvable');
    if (!auth.eventIds.includes(String(current.eventId))) throw new HttpError(403, 'Événement non assigné');
    if (op.kind === 'task' && !isManager(auth) && String(current.assigneeId) !== auth.sub) throw new HttpError(403, 'Tâche non assignée');
    if (op.kind === 'delivery' && !isManager(auth) && String(current.carrierId) !== auth.sub) throw new HttpError(403, 'Livraison non assignée');
    if (op.kind === 'anomaly') {
      const data = Schemas.anomalyCreate.parse({ ...op.data, itemId: op.entityId, reporterId: auth.sub });
      return { status: 'applied', entity: await this.repo.anomaly(auth.sub + ':' + op.id, { ...data, eventId: current.eventId }) };
    }
    if (current.mobileOperations?.includes(op.id)) return { status: 'applied', entity: current };
    let update: Record<string, unknown>;
    if (op.kind === 'task') update = z.object({ status: z.enum(['planned', 'in_progress', 'done', 'blocked']) }).strict().parse(op.data);
    else if (op.kind === 'delivery') {
      if (op.action === 'validate') {
        if (!isManager(auth)) throw new HttpError(403, 'Validation réservée au responsable');
        update = { routeSheetValidated: true };
      } else update = z.object({ status: z.enum(['planned', 'in_transit', 'delivered', 'cancelled']) }).strict().parse(op.data);
    } else if (op.action === 'scanned') update = {};
    else if (op.action === 'moved') {
      update = z.object({ zoneCode: z.string().trim().min(1) }).strict().parse(op.data);
      const snapshot=await this.repo.bootstrap(auth.sub,[String(current.eventId)],false);
      if(!snapshot.events[0]?.zones.some(zone=>zone.code===update.zoneCode))throw new HttpError(422,'Zone inconnue dans cet événement');
    }
    else if (op.action === 'transferred') {
      if (!isManager(auth)) throw new HttpError(403, 'Transfert réservé au responsable');
      update = z.object({ responsibleUserId: z.string().regex(/^[a-f0-9]{24}$/i) }).strict().parse(op.data);
      const recipient = await this.repo.user(String(update.responsibleUserId));
      if (!recipient?.active || !recipient.eventIds.map(String).includes(String(current.eventId))) throw new HttpError(422, 'Responsable non assigné à cet événement');
    } else if (op.action === 'maintenance') update = { status: 'maintenance' };
    else if (op.action === 'status') update = z.object({ status: z.enum(['available', 'in_transit', 'delivered', 'maintenance', 'lost', 'damaged']) }).strict().parse(op.data);
    else throw new HttpError(422, 'Action inconnue');
    const entity = await this.repo.apply(op.kind, op.entityId, op.expected, op.id, update, auth.sub, op.action);
    if (!entity) {
      const latest = await this.repo.entity(op.kind, op.entityId);
      if (latest?.mobileOperations?.includes(op.id)) return { status: 'applied', entity: latest };
      throw new HttpError(409, 'La donnée a changé sur le serveur. Choisissez la version à conserver.', { current: latest });
    }
    return { status: 'applied', entity };
  }
}
