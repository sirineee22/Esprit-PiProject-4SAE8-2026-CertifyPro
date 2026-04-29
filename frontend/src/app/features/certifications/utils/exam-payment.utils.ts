/** localStorage flag after Stripe checkout is verified for this certification */
export function examFeePaidStorageKey(certId: number): string {
  return `examFeePaid:${certId}`;
}

export function isExamFeePaid(certId: number): boolean {
  return localStorage.getItem(examFeePaidStorageKey(certId)) === '1';
}

export function setExamFeePaid(certId: number): void {
  localStorage.setItem(examFeePaidStorageKey(certId), '1');
}

/** From criteria JSON `price` field (same source as trainer create form). */
export function parseExamFeeFromCriteriaJson(criteriaDescription: string | null | undefined): number {
  if (!criteriaDescription) {
    return 0;
  }
  try {
    const c = JSON.parse(criteriaDescription) as { price?: string | number };
    return parseExamFeeUsd(c.price != null ? String(c.price) : '');
  } catch {
    return 0;
  }
}

/** From catalog/detail `cert.price` string. */
export function parseExamFeeUsd(priceRaw: string | null | undefined): number {
  if (priceRaw == null || String(priceRaw).trim() === '') {
    return 0;
  }
  const cleaned = String(priceRaw).replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return 0;
  }
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
