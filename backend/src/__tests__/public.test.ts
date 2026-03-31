import request from "supertest";
import { initDatabase, closeDatabase } from "../db";
import { loadConfig } from "../config";
import { generateToken } from "../middleware/auth";
import { app } from "../server";

export function createTestToken(asn: string = "4242421234"): string {
  const db = require("../db").getDatabase();
  db.prepare("INSERT INTO users (asn, enabled) VALUES (?, ?)").run(asn, 1);
  return generateToken(asn);
}

describe("Public Phonebook API", () => {
  const testASN = "4242421234";
  const testPrefix = "42401234";

  beforeAll(() => {
    loadConfig();
    initDatabase(":memory:");
    createTestToken(testASN);

    const db = require("../db").getDatabase();
    db.prepare("INSERT INTO ns_servers (asn, server) VALUES (?, ?)").run(
      testASN,
      "ns1.test.dn42",
    );
    db.prepare(
      "INSERT INTO phonebooks (asn, number, name) VALUES (?, ?, ?)",
    ).run(testASN, `${testPrefix}001`, "Test User");
    db.prepare(
      "INSERT INTO phonebooks (asn, number, name) VALUES (?, ?, ?)",
    ).run(testASN, `${testPrefix}002`, "Test User 2");
  });

  afterAll(() => {
    closeDatabase();
  });

  describe("GET /public/phonebook", () => {
    it("should return all public phonebook entries", async () => {
      const response = await request(app).get("/public/phonebook");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("asn");
      expect(response.body[0]).toHaveProperty("number");
      expect(response.body[0]).toHaveProperty("name");
    });

    it("should exclude disabled users", async () => {
      const db = require("../db").getDatabase();
      db.prepare("UPDATE users SET enabled = 0 WHERE asn = ?").run(testASN);

      const response = await request(app).get("/public/phonebook");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      db.prepare("UPDATE users SET enabled = 1 WHERE asn = ?").run(testASN);
    });
  });

  describe("GET /public/phonebook/download", () => {
    it("should return VCF format by default", async () => {
      const response = await request(app).get("/public/phonebook/download");

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toMatch(/vcard/i);
      expect(response.text).toContain("BEGIN:VCARD");
      expect(response.text).toContain("END:VCARD");
    });

    it("should return CSV format when requested", async () => {
      const response = await request(app).get(
        "/public/phonebook/download?format=csv",
      );

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toContain("text/csv");
      expect(response.text).toContain("Number,Name,ASN");
    });

    it("should return 400 for unsupported format", async () => {
      const response = await request(app).get(
        "/public/phonebook/download?format=json",
      );

      expect(response.status).toBe(400);
    });
  });
});
