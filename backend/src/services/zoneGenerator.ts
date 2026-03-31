import fs from "fs";
import { getDatabase } from "../db";
import { getConfig } from "../config";
import { getE164Zone } from "./prefix";
import { debounce } from "lodash";

function generateBindZoneInternal(): void {
  const config = getConfig();
  const db = getDatabase();

  const users = db
    .prepare("SELECT * FROM users WHERE enabled = 1")
    .all() as any[];

  let zoneData = `@ 3600 IN SOA ns.nia.dn42. dn42.strexp.net. ${Math.floor(Date.now() / 1000)} 10800 3600 604800 3600\n`;
  zoneData += `@ 3600 IN NS ns.nia.dn42.\n`;

  for (const record of config.dns.extraRecords) zoneData += `${record}\n`;

  for (const user of users) {
    const servers = db
      .prepare("SELECT server FROM ns_servers WHERE asn = ?")
      .all(user.asn) as any[];
    if (servers.length === 0) continue;

    const zonePrefix = getE164Zone(user.asn).replace(".e164.dn42", "");

    servers.forEach((row) => {
      const srv = row.server.trim();
      zoneData += `${zonePrefix} 3600 IN NS ${srv}.\n`;
    });
    zoneData += "\n";
  }

  const dir = config.dns.zoneFilePath.split("/").slice(0, -1).join("/");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(config.dns.zoneFilePath, zoneData, "utf-8");
}

export const generateBindZone = debounce(generateBindZoneInternal, 2000);
