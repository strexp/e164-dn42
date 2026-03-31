import fs from "fs";
import { generateBindZone } from "../services/zoneGenerator";
import { initDatabase, closeDatabase, getDatabase } from "../db";

jest.mock("../config", () => ({
  getConfig: jest.fn().mockReturnValue({
    dns: {
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
      "INSERT INTO ns_servers (asn, server) VALUES ('4242421111', 'fd00::1')",
    ).run();
    db.prepare(
      "INSERT INTO ns_servers (asn, server) VALUES ('4242421111', '10.0.0.1')",
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
    expect(content).toContain("IN SOA ns1.test.dn42. admin.test.dn42.");
    expect(content).toContain("1.1.1.1.0.4.2.4 IN NS ns1.example.dn42.");
    expect(content).toContain(
      "1.1.1.1.0.4.2.4 IN NS ns2.1.1.1.1.0.4.2.4.e164.dn42.",
    );
    expect(content).toContain("ns2.1.1.1.1.0.4.2.4 IN AAAA fd00::1");
    expect(content).toContain("ns3.1.1.1.1.0.4.2.4 IN A 10.0.0.1");

    jest.useRealTimers();
  });
});
