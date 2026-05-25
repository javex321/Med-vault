import type { PatientProfile } from "@medvault/shared";

import type { PatientProfileDocument } from "./patient-profile.model.js";

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function optionalNumber(value: number | null | undefined) {
  return value ?? undefined;
}

function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

export function toPatientProfile(profile: PatientProfileDocument): PatientProfile {
  return {
    id: profile._id.toString(),
    ownerId: profile.ownerId.toString(),
    relationshipToOwner: profile.relationshipToOwner,
    fullName: profile.fullName,
    dateOfBirth: toDateOnly(profile.dateOfBirth),
    sexAtBirth: profile.sexAtBirth,
    bloodGroup: profile.bloodGroup,
    heightCm: optionalNumber(profile.heightCm),
    weightKg: optionalNumber(profile.weightKg),
    allergies: profile.allergies.map((allergy) => ({
      name: allergy.name,
      reaction: optionalString(allergy.reaction),
      severity: allergy.severity,
      notes: optionalString(allergy.notes)
    })),
    chronicConditions: [...profile.chronicConditions],
    emergencyContacts: profile.emergencyContacts.map((contact) => ({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: optionalString(contact.email)
    })),
    primaryPhysicianName: optionalString(profile.primaryPhysicianName),
    notes: optionalString(profile.notes),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}
