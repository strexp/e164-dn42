import { getPrefix, getE164Zone, canWrite } from "../services/prefix";

jest.mock("../config", () => ({
  getConfig: jest.fn().mockReturnValue({
    e164: {
      zone: "e164.dn42",
      countryCode: "42",
      rules: [
        {
          asnMatch: "^424242(\\d{4})$",
          numberFormat: "40$1",
        },
        {
          asnMatch: "^64496$",
          numberFormat: "999",
        },
      ],
    },
  }),
}));

describe("Prefix Service", () => {
  describe("getPrefix", () => {
    it("should calculate correct prefix from configured ASN", () => {
      expect(getPrefix("4242421234")).toBe("42401234");
      expect(getPrefix("4242420000")).toBe("42400000");
      expect(getPrefix("4242429999")).toBe("42409999");
      expect(getPrefix("64496")).toBe("42999");
    });

    it("should return empty string for unconfigured ASN", () => {
      expect(getPrefix("6449612345")).toBe("");
      expect(getPrefix("12345")).toBe("");
    });

    it("should throw error for invalid ASN format", () => {
      expect(() => getPrefix("invalid")).toThrow("Invalid ASN format");
    });
  });

  describe("getE164Zone", () => {
    it("should calculate correct e164 zone from ASN", () => {
      expect(getE164Zone("4242421234")).toBe("4.3.2.1.0.4.2.4.e164.dn42");
      expect(getE164Zone("4242420000")).toBe("0.0.0.0.0.4.2.4.e164.dn42");
    });

    it("should return empty zone for unconfigured ASN", () => {
      expect(getE164Zone("12345")).toBe("");
    });
  });

  describe("canWrite", () => {
    it("should return true for configured ASNs", () => {
      expect(canWrite("4242421234")).toBe(true);
      expect(canWrite("64496")).toBe(true);
    });

    it("should return false for unconfigured ASNs", () => {
      expect(canWrite("6449612345")).toBe(false);
    });

    it("should return false for invalid ASN", () => {
      expect(canWrite("invalid")).toBe(false);
    });
  });
});
