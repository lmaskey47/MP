import { createHash } from 'node:crypto';
import { Schema, model, type Types } from 'mongoose';
import { ItemModel } from '../models/item.model';
import { TaskModel } from '../models/task.model';
import { EventModel } from '../models/event.model';
import { DeliveryModel } from '../models/delivery.model';
import { AnomalyModel } from '../models/anomaly.model';
import { UserModel, UserRole } from '../models/user.model';
import { NotificationModel } from '../models/notification.model';

const refreshSchema = new Schema({ hash: { type: String, unique: true }, userId: String, expiresAt: Date });
refreshSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Refresh = model('MobileRefresh', refreshSchema);
interface MobileEntity { _id:Types.ObjectId;eventId:string;updatedAt:Date;mobileOperations?:string[];assigneeId?:string;carrierId?:string }

export class MobileRepository {
  async bootstrap(userId: string, eventIds: string[], manager: boolean) {
    const filter = { eventId: { $in: eventIds } };
    const [events, items, tasks, deliveries, anomalies, notifications, people] = await Promise.all([
      EventModel.find({ _id: { $in: eventIds } }).lean(), ItemModel.find(filter).lean(),
      TaskModel.find({ ...filter, ...(manager ? {} : { assigneeId: userId }) }).sort({ dueAt: 1 }).lean(),
      DeliveryModel.find({ ...filter, ...(manager ? {} : { carrierId: userId }) }).lean(),
      AnomalyModel.find(filter).lean(), NotificationModel.find({ recipientId: userId, readAt: null }).lean(),
      manager ? UserModel.find({ eventIds: { $in: eventIds }, active: true }).select('name role eventIds').lean() : [],
    ]);
    return { events, items, tasks, deliveries, anomalies, notifications, people };
  }
  async entity(kind: string, id: string): Promise<MobileEntity|null> {
    if(kind==='item')return ItemModel.findById(id).lean();
    if(kind==='task')return TaskModel.findById(id).lean();
    if(kind==='delivery')return DeliveryModel.findById(id).lean();
    if(kind==='anomaly')return AnomalyModel.findById(id).lean();
    throw new Error('Unknown entity kind');
  }
  async apply(kind: string, id: string, expected: string, operationId: string, update: Record<string, unknown>, actorId: string, action: string) {
    const mutation: Record<string, unknown> = { $set: {...update, updatedAt: new Date(Math.max(Date.now(), new Date(expected).getTime()+1))}, $addToSet: { mobileOperations: operationId } };
    if (kind === 'item') {
      mutation.$inc = { offlineVersion: 1 };
      mutation.$push = { history: { action: action === 'status' ? 'moved' : action, actorId, at: new Date(), details: { ...update, clientOperationId: operationId } } };
    }
    const filter={ _id: id, updatedAt: new Date(expected), mobileOperations: { $ne: operationId } };
    const options={returnDocument:'after' as const,runValidators:true,timestamps:false};
    if(kind==='item')return ItemModel.findOneAndUpdate(filter,mutation,options).lean();
    if(kind==='task')return TaskModel.findOneAndUpdate(filter,mutation,options).lean();
    if(kind==='delivery')return DeliveryModel.findOneAndUpdate(filter,mutation,options).lean();
    throw new Error('Unknown entity kind');
  }
  async anomaly(operationId: string, data: Record<string, unknown>) {
    const id = createHash('sha256').update(operationId).digest('hex').slice(0, 24);
    const anomaly = await AnomalyModel.findOneAndUpdate({ _id: id }, { $setOnInsert: data }, { upsert: true, new: true, runValidators: true }).lean();
    await ItemModel.findOneAndUpdate({ _id: String(data.itemId), mobileOperations: {$ne: operationId} }, {
      $set: {status: 'damaged'}, $inc: {offlineVersion: 1}, $addToSet: {mobileOperations: operationId},
      $push: {history: {action:'anomaly',actorId:data.reporterId,at:new Date(),location:data.location,details:{anomalyId:id}}}
    });
    if(data.severity === 'critical' || data.severity === 'high') {
      const recipients = await UserModel.find({eventIds:String(data.eventId),role:{$in:[UserRole.Admin,UserRole.LogisticManager]},active:true}).select('_id');
      for(const recipient of recipients) {
        const noticeId=createHash('sha256').update(id+String(recipient._id)).digest('hex').slice(0,24);
        await NotificationModel.updateOne({_id:noticeId},{$setOnInsert:{eventId:data.eventId,recipientId:recipient._id,title:'Anomalie terrain',message:data.message,critical:data.severity==='critical'}},{upsert:true});
      }
    }
    return anomaly;
  }
  saveRefresh(hash: string, userId: string, expiresAt: Date) { return Refresh.create({ hash, userId, expiresAt }); }
  consumeRefresh(hash: string) { return Refresh.findOneAndDelete({ hash, expiresAt: { $gt: new Date() } }).lean(); }
  revokeRefresh(hash: string) { return Refresh.deleteOne({ hash }); }
  user(id: string) { return UserModel.findById(id); }
}
