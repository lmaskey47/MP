const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {App} = require('../dist/app');
const {UserModel} = require('../dist/models/user.model');
const {EventModel} = require('../dist/models/event.model');
const {ItemModel} = require('../dist/models/item.model');
const {TaskModel} = require('../dist/models/task.model');
const {DeliveryModel} = require('../dist/models/delivery.model');
const {AnomalyModel} = require('../dist/models/anomaly.model');
const {NotificationModel} = require('../dist/models/notification.model');
const dbName='logichain_test_'+randomUUID().replaceAll('-','');
let server;
let checks=0;
async function main(){
 await mongoose.connect('mongodb://127.0.0.1:27017/'+dbName,{serverSelectionTimeoutMS:5000});
 const event=await EventModel.create({name:'Test terrain',startsAt:new Date(),endsAt:new Date(Date.now()+86400000),location:{type:'Point',coordinates:[2,48]},zones:[]});
 const passwordHash=await bcrypt.hash('TestPassword123',4);
 const manager=await UserModel.create({name:'Manager Test',email:'manager@test.fr',passwordHash,role:'logistic_manager',eventIds:[event._id]});
 const agent=await UserModel.create({name:'Agent Test',email:'agent@test.fr',passwordHash,role:'field_agent',eventIds:[event._id]});
 const outsider=await UserModel.create({name:'Other Test',email:'other@test.fr',passwordHash,role:'field_agent',eventIds:[]});
 const item=await ItemModel.create({eventId:event._id,qrCode:'TEST-001',label:'Radio',category:'radio',carbonKg:5});
 const task=await TaskModel.create({eventId:event._id,assigneeId:agent._id,title:'Contrôler le stock'});
 const delivery=await DeliveryModel.create({eventId:event._id,carrierId:agent._id,stops:[]});
 await new Promise(resolve=>{server=new App().express.listen(0,'127.0.0.1',resolve);});
 const base='http://127.0.0.1:'+server.address().port+'/api/v1';
 async function call(path,body,token,method=body?'POST':'GET'){
  const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:res.status,body:await res.json().catch(()=>null)};
 }
 async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
 const login=async email=>(await call('/auth/login',{email,password:'TestPassword123'})).body;
 let session=await login(agent.email);const admin=await login(manager.email);const other=await login(outsider.email);
 await check('authentication required',async()=>assert.equal((await call('/mobile/bootstrap')).status,401));
 await check('bootstrap scoped to assigned event',async()=>{const r=await call('/mobile/bootstrap',null,session.token);assert.equal(r.body.items.length,1);assert.equal(r.body.tasks.length,1);assert.equal(r.body.events.length,1);assert.equal(r.body.people.length,0);assert.equal((await call('/mobile/bootstrap',null,other.token)).body.items.length,0);});
 const op={id:'test-operation-001',kind:'item',entityId:String(item._id),expected:item.updatedAt.toISOString(),action:'scanned',data:{}};
 let first;
 await check('scan is applied',async()=>{first=await call('/mobile/operations',op,session.token);assert.equal(first.status,200);assert.equal(first.body.entity.offlineVersion,1);});
 await check('lost response retry is idempotent',async()=>{const r=await call('/mobile/operations',op,session.token);assert.equal(r.status,200);assert.equal(r.body.entity.offlineVersion,1);assert.equal(r.body.entity.history.length,1);});
 await check('stale operation returns current entity',async()=>{const r=await call('/mobile/operations',{...op,id:'test-operation-002'},session.token);assert.equal(r.status,409);assert.equal(r.body.details.current.offlineVersion,1);});
 await check('rebased operation succeeds',async()=>{const r=await call('/mobile/operations',{...op,id:'test-operation-002',expected:first.body.entity.updatedAt},session.token);assert.equal(r.status,200);});
 await check('cross-event operation refused',async()=>assert.equal((await call('/mobile/operations',op,other.token)).status,403));
 await check('field agent cannot transfer responsibility',async()=>assert.equal((await call('/mobile/operations',{...op,id:'test-transfer-001',action:'transferred',data:{responsibleUserId:String(manager._id)}},session.token)).status,403));
 await check('task status and retry',async()=>{const taskOp={...op,id:'test-task-001',kind:'task',entityId:String(task._id),expected:task.updatedAt.toISOString(),action:'status',data:{status:'done'}};const r=await call('/mobile/operations',taskOp,session.token);assert.equal(r.body.entity.status,'done');assert.equal((await call('/mobile/operations',taskOp,session.token)).status,200);});
 await check('route sheet validation requires manager',async()=>{const d={...op,id:'test-delivery-001',kind:'delivery',entityId:String(delivery._id),expected:delivery.updatedAt.toISOString(),action:'validate',data:{routeSheetValidated:true}};assert.equal((await call('/mobile/operations',d,session.token)).status,403);assert.equal((await call('/mobile/operations',d,admin.token)).body.entity.routeSheetValidated,true);});
 await check('anomaly and critical alert are idempotent',async()=>{const a={...op,id:'test-anomaly-001',kind:'anomaly',action:'report',data:{severity:'critical',message:'Danger test',location:{type:'Point',coordinates:[2,48]}}};assert.equal((await call('/mobile/operations',a,session.token)).status,200);assert.equal((await call('/mobile/operations',a,session.token)).status,200);assert.equal(await AnomalyModel.countDocuments(),1);assert.equal(await NotificationModel.countDocuments(),1);assert.equal((await ItemModel.findById(item._id)).status,'damaged');});
 await check('invalid GPS rejected',async()=>{const a={...op,id:'test-anomaly-invalid',kind:'anomaly',data:{severity:'high',message:'GPS',location:{type:'Point',coordinates:[999,48]}}};assert.equal((await call('/mobile/operations',a,session.token)).status,422);});
 await check('refresh rotates and rejects replay',async()=>{const previous=session.refreshToken;const r=await call('/auth/refresh',{refreshToken:previous});assert.equal(r.status,200);session=r.body;assert.notEqual(session.refreshToken,previous);assert.equal((await call('/auth/refresh',{refreshToken:previous})).status,401);});
 await check('SSE sends authenticated initial event',async()=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);try{const r=await fetch(base+'/mobile/stream',{headers:{Authorization:'Bearer '+session.token},signal:controller.signal});assert.equal(r.status,200);const chunk=await r.body.getReader().read();assert.match(new TextDecoder().decode(chunk.value),/refresh/);}finally{controller.abort();clearTimeout(timer);}});
 await check('logout revokes refresh',async()=>{assert.equal((await call('/auth/logout',{refreshToken:session.refreshToken})).status,204);assert.equal((await call('/auth/refresh',{refreshToken:session.refreshToken})).status,401);});
 await check('public registration cannot grant administrator role',async()=>assert.equal((await call('/auth/register',{name:'No Admin',email:'no@test.fr',password:'TestPassword123',role:'admin',eventIds:[]})).status,403));
 await check('legacy routes also enforce event scope',async()=>assert.equal((await call('/events/'+event._id,null,other.token)).status,403));
 await check('new event is assigned to its creator',async()=>{
  const r=await call('/events',{name:'New event',startsAt:new Date().toISOString(),endsAt:new Date(Date.now()+86400000).toISOString(),location:{type:'Point',coordinates:[2,48]},zones:[]},admin.token);
  assert.equal(r.status,201);
  assert.ok((await call('/mobile/bootstrap',null,admin.token)).body.events.some(e=>e._id===r.body._id));
 });
 await check('concurrent writes cannot both use the same revision',async()=>{
  const latest=await ItemModel.findById(item._id);
  const base={...op,expected:latest.updatedAt.toISOString()};
  const results=await Promise.all([call('/mobile/operations',{...base,id:'concurrent-op-001'},admin.token),call('/mobile/operations',{...base,id:'concurrent-op-002'},admin.token)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 });
 console.log(checks+' integration checks passed.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
 if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 if(mongoose.connection.readyState===1&&mongoose.connection.name===dbName&&dbName.startsWith('logichain_test_'))await mongoose.connection.dropDatabase();
 await mongoose.disconnect();
});
