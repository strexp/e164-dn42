export function isValidTarget(target: string): boolean {
  const trimmed = target.trim().toLowerCase();
  return (
    trimmed.endsWith(".dn42") ||
    trimmed.endsWith(".neo") ||
    trimmed.endsWith(".hack") ||
    trimmed.endsWith(".crxn")
  );
}

export function validateASN(asn: string): boolean {
  return /^\d+$/.test(asn) && asn.length >= 5;
}

export function validateNumber(number: string, prefix: string): boolean {
  if (!/^\d+$/.test(number)) {
    return false;
  }
  return number.startsWith(prefix);
}
