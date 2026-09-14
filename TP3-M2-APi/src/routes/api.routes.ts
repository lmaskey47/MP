import { Router } from "express";
import { AnomalyController } from "../controllers/anomaly.controller";
import { AuthController } from "../controllers/auth.controller";
import { DashboardController } from "../controllers/dashboard.controller";
import { DeliveryController } from "../controllers/delivery.controller";
import { EventController } from "../controllers/event.controller";
import { ItemController } from "../controllers/item.controller";
import { MonitoringController } from "../controllers/monitoring.controller";
import { NotificationController } from "../controllers/notification.controller";
import { SyncController } from "../controllers/sync.controller";
import { TaskController } from "../controllers/task.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { UserRole } from "../models/user.model";
import {scopeMiddleware} from '../middlewares/scope.middleware';

export class ApiRoutes {
  public readonly router = Router();

  public constructor() {
    const auth = new AuthMiddleware();
    const authController = new AuthController();
    const events = new EventController();
    const items = new ItemController();
    const anomalies = new AnomalyController();
    const tasks = new TaskController();
    const deliveries = new DeliveryController();
    const dashboard = new DashboardController();
    const notifications = new NotificationController();
    const monitoring = new MonitoringController();
    const sync = new SyncController();

    this.router.post("/auth/register", asyncHandler(authController.register));
    this.router.post("/auth/login", asyncHandler(authController.login));

    this.router.use(auth.authenticate);
    this.router.use(scopeMiddleware);

    this.router.get("/events", asyncHandler(events.list));
    this.router.post("/events", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(events.create));
    this.router.get("/events/:eventId", asyncHandler(events.get));
    this.router.put("/events/:eventId", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(events.update));
    this.router.patch("/events/:eventId", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(events.update));
    this.router.delete("/events/:eventId", auth.authorize(UserRole.Admin), asyncHandler(events.delete));

    this.router.get("/events/:eventId/items", asyncHandler(items.list));
    this.router.post("/events/:eventId/items", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(items.create));
    this.router.get("/items/:itemId", asyncHandler(items.get));
    this.router.patch("/items/:itemId", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(items.update));
    this.router.delete("/items/:itemId", auth.authorize(UserRole.Admin), asyncHandler(items.delete));
    this.router.post("/items/:itemId/scans", asyncHandler(items.scan));
    this.router.post("/items/:itemId/movements", asyncHandler(items.move));
    this.router.post("/items/:itemId/transfers", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(items.transfer));
    this.router.post("/items/:itemId/maintenance", asyncHandler(items.maintenance));

    this.router.get("/events/:eventId/anomalies", asyncHandler(anomalies.list));
    this.router.post("/events/:eventId/anomalies", asyncHandler(anomalies.create));
    this.router.patch("/anomalies/:anomalyId", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(anomalies.update));

    this.router.get("/events/:eventId/tasks", asyncHandler(tasks.list));
    this.router.post("/events/:eventId/tasks", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(tasks.create));
    this.router.get("/users/:assigneeId/tasks", asyncHandler(tasks.byAssignee));
    this.router.patch("/tasks/:taskId", asyncHandler(tasks.update));

    this.router.get("/events/:eventId/deliveries", asyncHandler(deliveries.list));
    this.router.post("/events/:eventId/deliveries", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(deliveries.create));
    this.router.patch("/deliveries/:deliveryId", asyncHandler(deliveries.update));
    this.router.post("/deliveries/:deliveryId/route-sheet-validations", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(deliveries.validateRouteSheet));

    this.router.get("/events/:eventId/dashboard", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(dashboard.kpis));

    this.router.post("/notifications", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(notifications.create));
    this.router.get("/users/:recipientId/notifications", asyncHandler(notifications.unread));
    this.router.patch("/users/:recipientId/notifications/:notificationId/read", asyncHandler(notifications.read));

    this.router.post("/monitoring/metrics", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(monitoring.create));
    this.router.get("/events/:eventId/monitoring/metrics", auth.authorize(UserRole.Admin, UserRole.LogisticManager), asyncHandler(monitoring.list));

    this.router.post("/sync", asyncHandler(sync.apply));
  }
}
