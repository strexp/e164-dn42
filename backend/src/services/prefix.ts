import { getConfig } from "../config";
import { validateASN } from "../utils";

export function getPrefix(asn: string): string {
  if (!validateASN(asn)) {
    throw new Error("Invalid ASN format");
  }

  const config = getConfig();
  if (!config.e164 || !config.e164.rules) {
    return "";
  }

  const { countryCode, rules } = config.e164;

  for (const rule of rules) {
    const regex = new RegExp(rule.asnMatch);
    const match = asn.match(regex);
    if (match) {
      let formatted = rule.numberFormat;
      for (let i = 1; i < match.length; i++) {
        formatted = formatted.replace(
          new RegExp(`\\$${i}`, "g"),
          match[i] || "",
        );
      }
      return `${countryCode}${formatted}`;
    }
  }

  return "";
}

export function getE164Zone(asn: string): string {
  const config = getConfig();
  const prefix = getPrefix(asn);
  if (!prefix) return "";
  return prefix.split("").reverse().join(".") + "." + config.e164.zone;
}

export function canWrite(asn: string): boolean {
  try {
    return getPrefix(asn) !== "";
  } catch {
    return false;
  }
}
