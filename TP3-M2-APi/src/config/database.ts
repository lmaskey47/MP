import mongoose from "mongoose";
import { env } from "./env";

export class Database {
  public async connect(): Promise<void> {
    await mongoose.connect(env.mongoUri, { autoIndex: false, autoCreate: false });
    await this.ensureMonitoringTimeSeries();
    // createIndexes conserve les index existants et attend leur creation avant le trafic.
    await Promise.all(Object.values(mongoose.models).map((model) => model.createIndexes()));
  }

  public async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }

  private async ensureMonitoringTimeSeries(): Promise<void> {
    const db = mongoose.connection.db;
    if (!db) {
      return;
    }

    const existing = await db.listCollections({ name: "monitoringmetrics" }).toArray();
    if (existing.length === 0) {
      try {
        await db.createCollection("monitoringmetrics", {
          timeseries: {
            timeField: "capturedAt",
            metaField: "metadata",
            granularity: "minutes"
          }
        });
      } catch (error) {
        // Code MongoDB 48 : la collection existe deja, ce n'est pas une erreur bloquante.
        if ((error as { code?: number }).code !== 48) {
          // Autre erreur MongoDB : on la remonte car la base n'est peut-etre pas correctement initialisee.
          throw error;
        }
      }
    }
  }
}
