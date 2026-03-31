import fs from "fs";
import { getDatabase } from "../db";
import { getConfig } from "../config";
import { getE164Zone } from "../utils";
import { debounce } from "lodash";

function generateBindZoneInternal(): void {
  const config = getConfig();
  const db = getDatabase();

  const users = db
    .prepare("SELECT * FROM users WHERE enabled = 1")
    .all() as any[];

  let zoneData = `$ORIGIN e164.dn42.\n`;
  zoneData += `$TTL 3600\n`;
  const serial = Math.floor(Date.now() / 1000);
  zoneData += `@ IN SOA ${config.dns.soa.ns} ${config.dns.soa.email} ( ${serial} 3600 900 604800 86400 )\n\n`;

  for (const user of users) {
    const servers = db
      .prepare("SELECT server FROM ns_servers WHERE asn = ?")
      .all(user.asn) as any[];
    if (servers.length === 0) continue;

    const zonePrefix = getE164Zone(user.asn).replace(".e164.dn42", "");

    servers.forEach((row, index) => {
      const srv = row.server.trim();

      if (srv.endsWith(".dn42")) {
        zoneData += `${zonePrefix} IN NS ${srv}.\n`;
      } else {
        const nsDomain = `ns${index + 1}.${zonePrefix}`;
        zoneData += `${zonePrefix} IN NS ${nsDomain}.e164.dn42.\n`;
        const kind = srv.includes(":") ? "AAAA" : "A";
        zoneData += `${nsDomain} IN ${kind} ${srv}\n`;
      }
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
