import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import logger from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
// import proxyRoutes from "./routes/proxy/proxy.js";
import registerRoutes from "./routes/register/register.js";

dotenv.config();

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
// app.use("/apis", proxyRoutes);

// Global error handler
app.use(errorHandler);


app.listen(PORT, () => {
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
