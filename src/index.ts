import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import logger from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import registerRoutes from "./routes/register/register.js";
import proxyRoutes from "./routes/proxy/proxy.js";
import { connectRabbitMq } from "./config/rabbitMq.js";

dotenv.config();

/* this is the index.ts file for the rate-limiter, it has 2 strategies- token-bucket and sliding-window.
   the rate-limiter is a middleware that can be used to limit the number of requests to an api. it is used to prevent abuse of the api and to ensure that the api is available to all users. it is also used to prevent ddos attacks. the rate-limiter is a distributed system that uses rabbitmq as a message broker. it uses redis as a cache to store the rate limit data. it uses redis as a database to store the app data. it uses express as a web framework. it uses typescript as a programming language. it uses prettier as a code formatter. it uses dotenv as a configuration library. it uses morgan as a logging library. it uses winston as a logging library. it uses cors as a middleware. it uses helmet as a middleware. it uses compression as a middleware.
  */

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  morgan("dev", { stream: { write: (message) => logger.info(message.trim()) } })
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use("/apis", registerRoutes);
app.use("/apis", proxyRoutes);

// Global error handler
app.use(errorHandler);

app.listen(PORT, async () => {
  await connectRabbitMq();
  console.info(
    `\x1b[32m✅ SUCCESS:\x1b[0m Server running on: \x1b[4;36mhttp://localhost:${PORT}\x1b[0m`
  );
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (err: any) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
});
