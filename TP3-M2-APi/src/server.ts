import { App } from "./app";
import { Database } from "./config/database";
import { env } from "./config/env";

export class Server {
  public constructor(
    private readonly app = new App(),
    private readonly database = new Database()
  ) {}

  public async start(): Promise<void> {
    await this.database.connect();
    this.app.express.listen(env.port, env.host, () => {
      console.log(`LogiChain API listening on port ${env.port}`);
    });
  }
}

new Server().start().catch((error) => {
  // Erreur critique au demarrage : connexion MongoDB impossible, port indisponible ou configuration invalide.
  console.error(error);
  process.exit(1);
});
