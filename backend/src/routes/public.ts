import { Router, Response } from "express";
import { getDatabase } from "../db";

const router = Router();

router.get("/phonebook", (_req: any, res: Response) => {
  const db = getDatabase();

  const query = `
    SELECT p.asn, p.number, p.name
    FROM phonebooks p
    INNER JOIN users u ON u.asn = p.asn
    WHERE u.enabled = 1
    AND p.asn IN (
      SELECT DISTINCT asn FROM ns_servers
    )
    ORDER BY p.asn, p.number
  `;

  const entries = db.prepare(query).all() as any[];

  res.json(entries);
});

router.get("/phonebook/download", (req: any, res: Response) => {
  const db = getDatabase();

  const query = `
    SELECT p.asn, p.number, p.name
    FROM phonebooks p
    INNER JOIN users u ON u.asn = p.asn
    WHERE u.enabled = 1
    AND p.asn IN (
      SELECT DISTINCT asn FROM ns_servers
    )
    ORDER BY p.asn, p.number
  `;

  const entries = db.prepare(query).all() as any[];
  const format = req.query.format || "vcf";

  if (format === "vcf") {
    let vcf = "";
    for (const entry of entries) {
      vcf += "BEGIN:VCARD\n";
      vcf += "VERSION:3.0\n";
      vcf += `FN:${entry.name}\n`;
      vcf += `TEL;TYPE=VOICE,WORK:${entry.number}\n`;
      vcf += "END:VCARD\n";
    }

    res.header("Content-Type", "text/vcard");
    res.attachment("dn42_e164_phonebook.vcf");
    res.send(vcf);
  } else if (format === "csv") {
    let csv = "Number,Name,ASN\n";
    for (const entry of entries) {
      csv += `${entry.number},${entry.name},${entry.asn}\n`;
    }

    res.header("Content-Type", "text/csv");
    res.attachment("dn42_e164_phonebook.csv");
    res.send(csv);
  } else {
    res.status(400).json({ error: "Unsupported format. Use vcf or csv" });
  }
});

export default router;
