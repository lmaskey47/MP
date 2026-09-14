import {asyncHandler} from './asyncHandler';
import {MobileRepository} from '../repositories/mobile.repository';
import {HttpError} from '../utils/httpError';
import {isManager} from '../services/mobile.service';
import {ObjectId} from '../utils/objectId';

// Re-check assignment and identity for legacy REST routes as well as mobile operations.
export const scopeMiddleware=asyncHandler(async(req,_res,next)=>{
 const auth=req.auth!;
 const eventMatch=req.path.match(/^\/events\/([^/]+)/);
 if(eventMatch){ObjectId.assert(eventMatch[1],'event id');if(!auth.eventIds.includes(eventMatch[1]))throw new HttpError(403,'Événement non assigné');}
 const userMatch=req.path.match(/^\/users\/([^/]+)/);
 if(userMatch&&userMatch[1]!==auth.sub)throw new HttpError(403,'Accès réservé au destinataire');
 const resource=req.path.match(/^\/(items|tasks|deliveries|anomalies)\/([^/]+)/);
 if(resource){
  const kinds:Record<string,string>={items:'item',tasks:'task',deliveries:'delivery',anomalies:'anomaly'};
  ObjectId.assert(resource[2],'resource id');
  const entity=await new MobileRepository().entity(kinds[resource[1]],resource[2]);
  if(!entity)throw new HttpError(404,'Ressource introuvable');
  if(!auth.eventIds.includes(String(entity.eventId)))throw new HttpError(403,'Événement non assigné');
  if(resource[1]==='tasks'&&!isManager(auth)&&String(entity.assigneeId)!==auth.sub)throw new HttpError(403,'Tâche non assignée');
  if(resource[1]==='deliveries'&&!isManager(auth)&&String(entity.carrierId)!==auth.sub)throw new HttpError(403,'Livraison non assignée');
  if(!isManager(auth)&&req.method==='PATCH'&&['tasks','deliveries'].includes(resource[1])&&Object.keys(req.body??{}).some(key=>key!=='status'))throw new HttpError(403,'Seul le statut peut être modifié sur le terrain');
 }
 if(req.body?.actorId)req.body.actorId=auth.sub;
 if(req.body?.reporterId)req.body.reporterId=auth.sub;
 if(req.body?.eventId&&!auth.eventIds.includes(String(req.body.eventId)))throw new HttpError(403,'Événement non assigné');
 next();
});
