export type ConsentStatusInput = {
  expiresAt: Date;
  withdrawnAt?: Date | null;
};

export function getConsentStatus(consent: ConsentStatusInput, now = new Date()) {
  if (consent.withdrawnAt) return "withdrawn";
  if (consent.expiresAt.getTime() <= now.getTime()) return "expired";

  return "active";
}
