import request from "supertest";
import { initDatabase, closeDatabase, getDatabase } from "../db";
import { loadConfig } from "../config";
import { generateToken } from "../middleware/auth";
import { app } from "../server";

jest.mock("../services/zoneGenerator", () => ({
  generateBindZone: jest.fn(),
}));

export function createTestToken(asn: string = "4242421234"): string {
  const db = getDatabase();
  db.prepare("INSERT OR IGNORE INTO users (asn, enabled) VALUES (?, ?)").run(
    asn,
    1,
  );
  return generateToken(asn);
}

describe("NS API", () => {
  let testToken: string;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    loadConfig();
    initDatabase(":memory:");
    testToken = createTestToken();
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
    closeDatabase();
  });

  beforeEach(() => {
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        asn TEXT PRIMARY KEY,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS ns_servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asn TEXT NOT NULL,
        server TEXT NOT NULL,
        FOREIGN KEY(asn) REFERENCES users(asn) ON DELETE CASCADE
      );
    `);
    db.prepare("DELETE FROM ns_servers WHERE asn = ?").run("4242421234");
    db.prepare("INSERT OR IGNORE INTO users (asn, enabled) VALUES (?, ?)").run(
      "4242421234",
      1,
    );
    db.prepare("UPDATE users SET enabled = 1 WHERE asn = ?").run("4242421234");
  });

  describe("GET /ns", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/ns");
      expect(response.status).toBe(401);
    });

    it("should return empty NS list for new user", async () => {
      const response = await request(app)
        .get("/ns")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        enabled: true,
        servers: [],
      });
    });
  });

  describe("PUT /ns", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .put("/ns")
        .send({ enabled: true, servers: [] });

      expect(response.status).toBe(401);
    });

    it("should update NS configuration successfully", async () => {
      const response = await request(app)
        .put("/ns")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ enabled: true, servers: ["ns1.test.dn42"] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it("should reject invalid server target", async () => {
      const response = await request(app)
        .put("/ns")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ enabled: true, servers: ["8.8.8.8"] });

      expect(response.status).toBe(400);
    });

    it("should reject too many servers", async () => {
      const response = await request(app)
        .put("/ns")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          enabled: true,
          servers: [
            "ns1.test.dn42",
            "ns2.test.dn42",
            "ns3.test.dn42",
            "ns4.test.dn42",
            "ns5.test.dn42",
          ],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Non-424242 ASN access", () => {
    beforeEach(() => {
      const db = getDatabase();
      db.prepare(
        "INSERT OR IGNORE INTO users (asn, enabled) VALUES (?, ?)",
      ).run("6449612345", 1);
    });

    it("should reject write for non-424242 ASN", async () => {
      const nonWriteToken = generateToken("6449612345");

      const response = await request(app)
        .put("/ns")
        .set("Authorization", `Bearer ${nonWriteToken}`)
        .send({ enabled: true, servers: ["ns1.test.dn42"] });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Write access is only available");
    });

    it("should allow read for non-424242 ASN", async () => {
      const nonWriteToken = generateToken("6449612345");

      const response = await request(app)
        .get("/ns")
        .set("Authorization", `Bearer ${nonWriteToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    it("should return 404 for deleted user in GET /ns", async () => {
      const db = getDatabase();
      db.prepare("DELETE FROM users WHERE asn = ?").run("4242421234");
      const response = await request(app)
        .get("/ns")
        .set("Authorization", `Bearer ${testToken}`);
      expect(response.status).toBe(404);

      createTestToken("4242421234");
    });

    it("should reject more servers than config allows", async () => {
      const configMod = require("../config");
      jest.spyOn(configMod, "getConfig").mockReturnValue({
        dns: {
          maxNsServers: 1,
          soa: { ns: "ns", email: "e" },
          zoneFilePath: "",
        },
        server: {
          port: 3000,
          jwtSecret: "change-this-secret-in-production",
          frontendUrl: "",
        },
        oauth: [],
      });
      const response = await request(app)
        .put("/ns")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ enabled: true, servers: ["ns1.test.dn42", "ns2.test.dn42"] });

      jest.restoreAllMocks();

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Maximum 1 NS servers allowed");
    });

    it("should handle invalid enabled type in PATCH /ns/status", async () => {
      const response = await request(app)
        .patch("/ns/status")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ enabled: "true" });
      expect(response.status).toBe(400);
    });

    it("should return 500 on db error in PATCH /ns/status", async () => {
      const db = getDatabase();
      db.prepare("DROP TABLE users").run();
      const response = await request(app)
        .patch("/ns/status")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ enabled: true });
      expect(response.status).toBe(500);

      initDatabase(":memory:");
      createTestToken("4242421234");
    });

    it("should return 500 on db error during PUT", async () => {
      const db = getDatabase();
      db.prepare("DROP TABLE ns_servers").run();
      const response = await request(app)
        .put("/ns")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ enabled: true, servers: ["ns1.test.dn42"] });

      expect(response.status).toBe(500);
      initDatabase(":memory:");
      createTestToken("4242421234");
    });
  });
});
