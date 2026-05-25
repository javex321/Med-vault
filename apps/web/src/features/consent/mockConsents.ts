import type { ConsentGrant } from "@medvault/shared";

export const mockConsents: ConsentGrant[] = [
  {
    id: "consent-demo-1",
    ownerId: "demo-user",
    profileId: "demo-profile",
    documentId: "doc-demo-1",
    recipientName: "Dr. Meera Sharma",
    recipientEmail: "doctor@example.com",
    purpose: "Cardiology review before follow-up consultation.",
    legalBasis: "treatment",
    scopes: ["documents:read", "timeline:read"],
    status: "active",
    expiresAt: "2026-06-18T10:00:00.000Z",
    grantedAt: "2026-05-18T10:00:00.000Z",
    createdAt: "2026-05-18T10:00:00.000Z",
    updatedAt: "2026-05-18T10:00:00.000Z"
  },
  {
    id: "consent-demo-2",
    ownerId: "demo-user",
    profileId: "demo-profile",
    recipientEmail: "insurance@example.com",
    purpose: "Insurance reimbursement verification for lab records.",
    legalBasis: "insurance",
    scopes: ["documents:read"],
    status: "withdrawn",
    expiresAt: "2026-06-02T10:00:00.000Z",
    grantedAt: "2026-05-10T10:00:00.000Z",
    withdrawnAt: "2026-05-15T12:00:00.000Z",
    withdrawalReason: "Claim review completed.",
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-15T12:00:00.000Z"
  }
];
