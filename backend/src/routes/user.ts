// backend/src/routes/user.ts
import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getPrefix, getE164Zone } from "../utils";
import { getDatabase } from "../db";

const router = Router();

router.get("/me", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const asn = req.user.asn;
  const prefix = getPrefix(asn);
  const e164Zone = getE164Zone(asn);

  res.json({
    asn,
    prefix,
    e164Zone,
  });
});

router.get("/participants", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabase();

  const query = `
    SELECT DISTINCT u.asn
    FROM users u
    INNER JOIN ns_servers n ON u.asn = n.asn
    WHERE u.enabled = 1
    ORDER BY u.asn
  `;

  const entries = db.prepare(query).all() as { asn: string }[];

  const participants = entries.map((entry) => {
    let prefix = "";
    try {
      prefix = getPrefix(entry.asn);
    } catch {
      prefix = "N/A";
    }
    return {
      asn: entry.asn,
      prefix,
    };
  });

  res.json(participants);
});

export default router;
