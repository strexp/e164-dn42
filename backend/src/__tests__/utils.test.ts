import {
  isValidTarget,
  validateASN,
  getPrefix,
  getE164Zone,
  validateNumber,
  canWrite,
} from "../utils";

describe("Utils", () => {
  describe("isValidTarget", () => {
    it("should accept valid .dn42 domains", () => {
      expect(isValidTarget("ns1.example.dn42")).toBe(true);
      expect(isValidTarget("ns.example.dn42")).toBe(true);
    });

    it("should accept valid IPv6 addresses in fd00::/8", () => {
      expect(isValidTarget("fd00::1")).toBe(true);
      expect(isValidTarget("fd00:1234::1")).toBe(true);
    });

    it("should accept valid IPv4 addresses in allowed ranges", () => {
      expect(isValidTarget("172.20.0.1")).toBe(true);
      expect(isValidTarget("172.21.0.1")).toBe(true);
      expect(isValidTarget("172.22.0.1")).toBe(true);
      expect(isValidTarget("172.23.255.255")).toBe(true);
      expect(isValidTarget("10.0.0.1")).toBe(true);
      expect(isValidTarget("10.255.255.255")).toBe(true);
      expect(isValidTarget("172.31.0.1")).toBe(true);
    });

    it("should reject invalid targets", () => {
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

  describe("getPrefix", () => {
    it("should calculate correct prefix from ASN", () => {
      expect(getPrefix("4242421234")).toBe("42401234");
      expect(getPrefix("4242420000")).toBe("42400000");
      expect(getPrefix("4242429999")).toBe("42409999");
    });

    it("should return empty string for non-424242 ASN", () => {
      expect(getPrefix("6449612345")).toBe("");
      expect(getPrefix("12345")).toBe("");
    });
  });

  describe("getE164Zone", () => {
    it("should calculate correct e164 zone from ASN", () => {
      expect(getE164Zone("4242421234")).toBe("4.3.2.1.0.4.2.4.e164.dn42");
      expect(getE164Zone("4242420000")).toBe("0.0.0.0.0.4.2.4.e164.dn42");
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

  describe("canWrite", () => {
    it("should return true for 424242 ASNs", () => {
      expect(canWrite("4242421234")).toBe(true);
      expect(canWrite("4242420000")).toBe(true);
      expect(canWrite("4242429999")).toBe(true);
    });

    it("should return false for non-424242 ASNs", () => {
      expect(canWrite("6449612345")).toBe(false);
      expect(canWrite("2085112345")).toBe(false);
      expect(canWrite("4242411234")).toBe(false);
    });
  });
});
