import "express-async-errors";
import express from "express";
import { initDatabase } from "./db";
import { loadConfig } from "./config";
import { authMiddleware } from "./middleware/auth";
import authRoutes from "./routes/auth";
import nsRoutes from "./routes/ns";
import phonebookRoutes from "./routes/phonebook";
import publicRoutes from "./routes/public";
import userRoutes from "./routes/user";
import cors from "cors";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/ns", authMiddleware, nsRoutes);
app.use("/phonebook", authMiddleware, phonebookRoutes);
app.use("/public", publicRoutes);
app.use("/user", authMiddleware, userRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

export function startServer() {
  const config = loadConfig();
  initDatabase();

  const host = config.server.host;
  const port = config.server.port;
  app.listen(port, host, () => {
    console.log(`Server running on port ${port}`);
  });
}
