import dotenv from "dotenv";

dotenv.config();

export class Env {
  public readonly port: number;
  public readonly mongoUri: string;
  public readonly jwtSecret: string;
  public readonly jwtExpiresIn: string;
  public readonly host: string;

  public constructor() {
    this.port = Number(process.env.PORT ?? 3000);
    this.mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/logichain";
    this.jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "8h";
    this.host = process.env.HOST ?? "0.0.0.0";
    if (!Number.isInteger(this.port) || this.port < 1 || this.port > 65535) {
      throw new Error("PORT must be an integer between 1 and 65535");
    }
    if (process.env.NODE_ENV === "production") {
      if (!process.env.MONGODB_URI || !/^mongodb(?:\+srv)?:\/\/[^@/]+:[^@/]+@/.test(this.mongoUri)) {
        throw new Error("Production requires an authenticated MONGODB_URI");
      }
      if (!process.env.JWT_SECRET || this.jwtSecret.length < 32 || this.jwtSecret === "dev-secret-change-me") {
        throw new Error("Production requires a JWT_SECRET of at least 32 characters");
      }
    }
  }
}

export const env = new Env();
