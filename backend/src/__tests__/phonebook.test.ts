import request from "supertest";
import { initDatabase, closeDatabase, getDatabase } from "../db";
import { loadConfig } from "../config";
import { generateToken } from "../middleware/auth";
import { app } from "../server";

export function createTestToken(asn: string = "4242421234"): string {
  const db = getDatabase();
  db.prepare("INSERT OR IGNORE INTO users (asn, enabled) VALUES (?, ?)").run(
    asn,
    1,
  );
  return generateToken(asn);
}

describe("Phonebook API", () => {
  let testToken: string;
  const testPrefix = "42401234";

  beforeAll(() => {
    loadConfig();
    initDatabase(":memory:");
    testToken = createTestToken();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    const db = getDatabase();
    db.prepare("INSERT OR IGNORE INTO users (asn, enabled) VALUES (?, ?)").run(
      "4242421234",
      1,
    );
    db.prepare("DELETE FROM phonebooks WHERE asn = ?").run("4242421234");
  });

  describe("GET /phonebook/me", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/phonebook/me");
      expect(response.status).toBe(401);
    });

    it("should return empty phonebook for new user", async () => {
      const response = await request(app)
        .get("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("POST /phonebook/me", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/phonebook/me")
        .send({ number: `${testPrefix}001`, name: "Test User" });

      expect(response.status).toBe(401);
    });

    it("should create phonebook entry successfully", async () => {
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: `${testPrefix}001`, name: "Test User" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.number).toBe(`${testPrefix}001`);
      expect(response.body.name).toBe("Test User");
    });

    it("should reject number without correct prefix", async () => {
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: "4250000001", name: "Test User" });

      expect(response.status).toBe(400);
    });

    it("should reject write for non-424242 ASN", async () => {
      const db = getDatabase();
      db.prepare(
        "INSERT OR IGNORE INTO users (asn, enabled) VALUES (?, ?)",
      ).run("6449612345", 1);
      const nonWriteToken = generateToken("6449612345");

      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${nonWriteToken}`)
        .send({ number: "42401234567", name: "Test User" });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Write access is only available");
    });
  });

  describe("DELETE /phonebook/me/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).delete("/phonebook/me/1");

      expect(response.status).toBe(401);
    });

    it("should delete phonebook entry successfully", async () => {
      const createResponse = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: `${testPrefix}001`, name: "Test User" });

      const id = createResponse.body.id;

      const deleteResponse = await request(app)
        .delete(`/phonebook/me/${id}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ success: true });
    });
  });

  describe("Non-424242 ASN access", () => {
    beforeEach(() => {
      const db = getDatabase();
      db.prepare(
        "INSERT OR IGNORE INTO users (asn, enabled) VALUES (?, ?)",
      ).run("6449612345", 1);
    });

    it("should allow read for non-424242 ASN", async () => {
      const nonWriteToken = generateToken("6449612345");

      const response = await request(app)
        .get("/phonebook/me")
        .set("Authorization", `Bearer ${nonWriteToken}`);

      expect(response.status).toBe(200);
    });

    it("should reject write for non-424242 ASN", async () => {
      const nonWriteToken = generateToken("6449612345");

      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${nonWriteToken}`)
        .send({ number: "42401234567", name: "Test User" });

      expect(response.status).toBe(403);
    });

    it("should reject delete for non-424242 ASN", async () => {
      const nonWriteToken = generateToken("6449612345");

      const response = await request(app)
        .delete("/phonebook/me/1")
        .set("Authorization", `Bearer ${nonWriteToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Edge Cases", () => {
    it("should reject more than 20 entries per ASN", async () => {
      const db = getDatabase();
      for (let i = 0; i < 20; i++) {
        db.prepare(
          "INSERT INTO phonebooks (asn, number, name) VALUES (?, ?, ?)",
        ).run("4242421234", `424012340${i + 10}`, "Test");
      }
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: "42401234999", name: "Overflow" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Maximum 20");
    });

    it("should return 404 when deleting non-existent entry", async () => {
      const response = await request(app)
        .delete("/phonebook/me/9999")
        .set("Authorization", `Bearer ${testToken}`);
      expect(response.status).toBe(404);
    });

    it("should handle zod validation error", async () => {
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: "abc", name: "" });
      expect(response.status).toBe(400);
    });

    it("should return 500 on db error during POST", async () => {
      const db = getDatabase();
      db.prepare("DROP TABLE phonebooks").run();
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: "42401234001", name: "Test" });
      expect(response.status).toBe(500);

      initDatabase(":memory:");
      createTestToken("4242421234");
    });
  });
});
