import { createServer } from "node:http";
import { setupApp } from "./app";
import { env } from "./env";

(async () => {
  const app = await setupApp({ serveFrontend: true });
  const server = createServer(app);

  server.listen(env.PORT, "0.0.0.0", () => {
    console.log(`express server serving on port ${env.PORT}`);
  });
})();
