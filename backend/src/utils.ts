import ipaddr from "ipaddr.js";

const ALLOWED_RANGES = [
  ipaddr.parseCIDR("fd00::/8"),
  ipaddr.parseCIDR("172.20.0.0/14"),
  ipaddr.parseCIDR("10.0.0.0/8"),
  ipaddr.parseCIDR("172.31.0.0/16"),
];

export function isValidTarget(target: string): boolean {
  const trimmed = target.trim();

  if (trimmed.endsWith(".dn42")) {
    return true;
  }

  try {
    const ip = ipaddr.parse(trimmed);
    const sameTypeRanges = ALLOWED_RANGES.filter((range) => {
      if (ip.kind() === "ipv6" && range[0].kind() === "ipv6") return true;
      if (ip.kind() === "ipv4" && range[0].kind() === "ipv4") return true;
      return false;
    });
    return sameTypeRanges.some((range) => ip.match(range));
  } catch {
    return false;
  }
}

export function validateASN(asn: string): boolean {
  return /^\d+$/.test(asn) && asn.length >= 5;
}

export function getPrefix(asn: string): string {
  if (!validateASN(asn)) {
    throw new Error("Invalid ASN format");
  }

  if (asn.startsWith("424242")) {
    const asnLastFour = asn.slice(6);
    return `4240${asnLastFour}`;
  }

  return "";
}

export function getE164Zone(asn: string): string {
  const prefix = getPrefix(asn);
  if (!prefix) return "";
  return prefix.split("").reverse().join(".") + ".e164.dn42";
}

export function validateNumber(number: string, prefix: string): boolean {
  if (!/^\d+$/.test(number)) {
    return false;
  }
  return number.startsWith(prefix);
}

export function canWrite(asn: string): boolean {
  return asn.startsWith("424242");
}
