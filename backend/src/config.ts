import { Config } from "./types";
import fs from "fs";

let config: Config | null = null;

export function loadConfig(configPath: string = "config.json"): Config {
  if (config) {
    return config;
  }

  const defaultConfig: Config = {
    server: {
      host: "127.0.0.1",
      port: 3000,
      jwtSecret: "change-this-secret-in-production",
      frontendUrl: "http://localhost:3001",
    },
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
    db: "db/e164.db",
    dns: {
      zoneFilePath: "../data/e164.dn42.zone",
      extraRecords: [],
      soa: {
        ns: "ns1.yourdomain.dn42.",
        email: "admin.yourdomain.dn42.",
      },
      maxNsServers: 4,
    },
    oauth: [],
  };

  if (fs.existsSync(configPath)) {
    const fileContent = fs.readFileSync(configPath, "utf-8");
    const userConfig = JSON.parse(fileContent);
    config = { ...defaultConfig, ...userConfig };
  } else {
    config = defaultConfig;
  }

  return config!;
}

export function getConfig(): Config {
  if (!config) {
    throw new Error("Config not loaded. Call loadConfig() first.");
  }
  return config;
}
