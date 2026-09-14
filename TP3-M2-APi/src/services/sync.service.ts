import { ItemRepository } from "../repositories/item.repository";
import { HttpError } from "../utils/httpError";
import { ObjectId } from "../utils/objectId";

type SyncOperation = {
  clientOperationId: string;
  itemId: string;
  expectedOfflineVersion: number;
  action: "scanned" | "moved" | "transferred" | "maintenance";
  actorId: string;
  payload: Record<string, unknown>;
};

export class SyncService {
  public constructor(private readonly items = new ItemRepository()) {}

  public async apply(operations: SyncOperation[]) {
    const results = [];

    for (const operation of operations) {
      ObjectId.assert(operation.itemId, "item id");
      const update = this.buildUpdate(operation);
      const item = await this.items.updateWithOptimisticLock(
        operation.itemId,
        operation.expectedOfflineVersion,
        update,
        {
          action: operation.action,
          at: new Date(),
          actorId: operation.actorId,
          location: operation.payload.location as never,
          toZone: operation.payload.toZone as string | undefined,
          details: operation.payload
        }
      );

      if (!item) {
        const current = await this.items.findById(operation.itemId);
        results.push({
          clientOperationId: operation.clientOperationId,
          status: "conflict",
          currentOfflineVersion: current?.offlineVersion
        });
        continue;
      }

      results.push({ clientOperationId: operation.clientOperationId, status: "applied", item });
    }

    const hasConflict = results.some((result) => result.status === "conflict");
    if (hasConflict) {
      // 409 : conflit de synchronisation, la version offline attendue ne correspond plus a la version en base.
      throw new HttpError(409, "One or more offline operations are in conflict", { results });
    }

    return { results };
  }

  private buildUpdate(operation: SyncOperation): Record<string, unknown> {
    if (operation.action === "moved") return { zoneCode: operation.payload.toZone };
    if (operation.action === "transferred") return { responsibleUserId: operation.payload.responsibleUserId };
    if (operation.action === "maintenance") return { status: "maintenance" };
    return {};
  }
}
