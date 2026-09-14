import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs/openapi";
import { errorMiddleware } from "./middlewares/error.middleware";
import { ApiRoutes } from "./routes/api.routes";
import { mobileRoutes } from './routes/mobile.routes';
import { live } from './services/live.service';

export class App {
  public readonly express = express();

  public constructor() {
    this.configure();
    this.routes();
    this.errors();
  }

  private configure(): void {
    this.express.use(helmet());
    this.express.use(cors());
    this.express.use(express.json({ limit: "2mb" }));
    this.express.use(morgan("combined"));
    this.express.use((req, res, next) => {
      res.on('finish', () => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 300 && !req.path.includes('/auth/')) live.emit('change');
      });
      next();
    });
  }

  private routes(): void {
    this.express.get("/health", (_request, response) => response.status(200).json({ status: "ok" }));
    this.express.get("/ready", async (_request, response) => {
      try {
        if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
          response.status(503).json({ status: "unavailable" });
          return;
        }
        await mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 3000 });
        response.status(200).json({ status: "ready" });
      } catch {
        response.status(503).json({ status: "unavailable" });
      }
    });
    this.express.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
    this.express.get("/openapi.json", (_request, response) => response.status(200).json(openApiDocument));
    this.express.use('/api/v1', mobileRoutes);
    this.express.use("/api/v1", new ApiRoutes().router);
  }

  private errors(): void {
    this.express.use(errorMiddleware);
  }
}
