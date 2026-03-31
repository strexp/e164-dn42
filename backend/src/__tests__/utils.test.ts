import {
  isValidTarget,
  validateASN,
  validateNumber,
} from "../utils";

describe("Utils", () => {
  describe("isValidTarget", () => {
    it("should accept valid allowed domains", () => {
      expect(isValidTarget("ns1.example.dn42")).toBe(true);
      expect(isValidTarget("ns.example.neo")).toBe(true);
      expect(isValidTarget("ns.example.hack")).toBe(true);
      expect(isValidTarget("ns.example.crxn")).toBe(true);
    });

    it("should reject IP addresses and other domains", () => {
      expect(isValidTarget("fd00::1")).toBe(false);
      expect(isValidTarget("10.0.0.1")).toBe(false);
      expect(isValidTarget("8.8.8.8")).toBe(false);
      expect(isValidTarget("example.com")).toBe(false);
      expect(isValidTarget("ns1.example.net")).toBe(false);
    });
  });

  describe("validateASN", () => {
    it("should accept valid 424242xxxx format", () => {
      expect(validateASN("4242421234")).toBe(true);
      expect(validateASN("4242420000")).toBe(true);
      expect(validateASN("4242429999")).toBe(true);
    });

    it("should accept valid non-424242 ASN format", () => {
      expect(validateASN("6449612345")).toBe(true);
      expect(validateASN("2085112345")).toBe(true);
      expect(validateASN("12345")).toBe(true);
      expect(validateASN("12345678901")).toBe(true);
      expect(validateASN("424242123")).toBe(true);
    });

    it("should reject invalid ASN formats", () => {
      expect(validateASN("42424abcd")).toBe(false);
      expect(validateASN("abcd")).toBe(false);
      expect(validateASN("1234")).toBe(false);
    });
  });

  describe("validateNumber", () => {
    it("should accept valid numbers with correct prefix", () => {
      expect(validateNumber("42401234001", "42401234")).toBe(true);
      expect(validateNumber("42401234000", "42401234")).toBe(true);
    });

    it("should reject numbers without correct prefix", () => {
      expect(validateNumber("42501234001", "42401234")).toBe(false);
      expect(validateNumber("123456789", "42401234")).toBe(false);
    });

    it("should reject non-digit characters", () => {
      expect(validateNumber("42401234a01", "42401234")).toBe(false);
      expect(validateNumber("42401234-01", "42401234")).toBe(false);
    });
  });
});
