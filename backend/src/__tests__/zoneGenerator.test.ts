import fs from "fs";
import { generateBindZone } from "../services/zoneGenerator";
import { initDatabase, closeDatabase, getDatabase } from "../db";

jest.mock("../config", () => ({
  getConfig: jest.fn().mockReturnValue({
    e164: {
      zone: "e164.dn42",
      countryCode: "424",
      rules: [
        {
          asnMatch: "^424242(\\d{4})$",
          numberFormat: "0$1",
        },
      ],
    },
    dns: {
      extraRecords: [],
      zoneFilePath: "/tmp/test.zone",
      soa: { ns: "ns1.test.dn42.", email: "admin.test.dn42." },
      maxNsServers: 4,
    },
  }),
}));

describe("Zone Generator Coverage", () => {
  beforeAll(() => {
    initDatabase(":memory:");
    const db = getDatabase();
    db.prepare(
      "INSERT INTO users (asn, enabled) VALUES ('4242421111', 1)",
    ).run();
    db.prepare(
      "INSERT INTO ns_servers (asn, server) VALUES ('4242421111', 'ns1.example.dn42')",
    ).run();
    db.prepare(
      "INSERT INTO ns_servers (asn, server) VALUES ('4242421111', 'ns2.example.neo')",
    ).run();
    db.prepare(
      "INSERT INTO ns_servers (asn, server) VALUES ('4242421111', 'ns3.example.hack')",
    ).run();
  });

  afterAll(() => {
    closeDatabase();
    jest.restoreAllMocks();
  });

  it("should generate valid zone string and save to file successfully", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(fs, "mkdirSync").mockReturnValue("/tmp" as any);
    jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    jest.useFakeTimers();

    generateBindZone();
    jest.runAllTimers();

    expect(fs.writeFileSync).toHaveBeenCalled();
    const callArgs = (fs.writeFileSync as jest.Mock).mock.calls[0];
    const filePath = callArgs[0];
    const content = callArgs[1];

    expect(filePath).toBe("/tmp/test.zone");
    expect(content).toContain("1.1.1.1.0.4.2.4 3600 IN NS ns1.example.dn42.");
    expect(content).toContain("1.1.1.1.0.4.2.4 3600 IN NS ns2.example.neo.");
    expect(content).toContain("1.1.1.1.0.4.2.4 3600 IN NS ns3.example.hack.");

    jest.useRealTimers();
  });
});
