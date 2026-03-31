import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { registryMiddleware } from "../middleware/registry";
import { getDatabase } from "../db";
import { isValidTarget } from "../utils";
import { getConfig } from "../config";
import { nsConfigSchema } from "../schemas";
import { generateBindZone } from "../services/zoneGenerator";

const router = Router();

router.get("/", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabase();
  const user = db
    .prepare("SELECT * FROM users WHERE asn = ?")
    .get(req.user.asn) as any;

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const servers = db
    .prepare("SELECT server FROM ns_servers WHERE asn = ?")
    .all(req.user.asn) as any[];
  const serverList = servers.map((s) => s.server);

  res.json({
    enabled: !!user.enabled,
    servers: serverList,
  });
});

router.put("/", registryMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = nsConfigSchema.parse(req.body);
    const config = getConfig();

    if (data.servers.length > config.dns.maxNsServers) {
      res.status(400).json({
        error: `Maximum ${config.dns.maxNsServers} NS servers allowed`,
      });
      return;
    }

    for (const server of data.servers) {
      if (!isValidTarget(server)) {
        res.status(400).json({
          error: `Invalid target: ${server}. Must be a .dn42 domain or in allowed IP ranges`,
        });
        return;
      }
    }

    const db = getDatabase();

    db.prepare("UPDATE users SET enabled = ? WHERE asn = ?").run(
      Number(data.enabled),
      req.user.asn,
    );
    db.prepare("DELETE FROM ns_servers WHERE asn = ?").run(req.user.asn);

    for (const server of data.servers) {
      db.prepare("INSERT INTO ns_servers (asn, server) VALUES (?, ?)").run(
        req.user.asn,
        server,
      );
    }

    generateBindZone();

    res.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ error: "Invalid request body" });
    } else {
      console.error("NS config error:", error);
      res.status(500).json({ error: "Failed to update NS configuration" });
    }
  }
});

router.patch(
  "/status",
  registryMiddleware,
  (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      if (typeof req.body.enabled !== "boolean") {
        res.status(400).json({ error: "Invalid request body" });
        return;
      }

      const db = getDatabase();
      db.prepare("UPDATE users SET enabled = ? WHERE asn = ?").run(
        Number(req.body.enabled),
        req.user.asn,
      );

      generateBindZone();

      res.json({ success: true });
    } catch (error) {
      console.error("NS status update error:", error);
      res.status(500).json({ error: "Failed to update NS status" });
    }
  },
);

export default router;
