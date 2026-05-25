import type { TimelineEvent } from "@medvault/shared";

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "mock-1",
    ownerId: "demo-user",
    profileId: "demo-profile",
    type: "visit",
    title: "Annual checkup",
    occurredAt: "2026-05-17T09:00:00.000Z",
    providerName: "Dr. Sharma",
    facilityName: "City Clinic",
    summary: "Routine primary care review with normal vitals and follow-up lab recommendations.",
    tags: ["checkup", "primary-care"],
    source: "manual",
    sensitivity: "normal",
    fhirResource: {
      resourceType: "Encounter",
      coding: [
        {
          system: "https://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "Ambulatory"
        }
      ]
    },
    createdAt: "2026-05-17T09:30:00.000Z",
    updatedAt: "2026-05-17T09:30:00.000Z"
  },
  {
    id: "mock-2",
    ownerId: "demo-user",
    profileId: "demo-profile",
    type: "lab_result",
    title: "Blood report uploaded",
    occurredAt: "2026-05-16T11:20:00.000Z",
    facilityName: "MedLab Diagnostics",
    summary: "CBC and lipid panel received. LDL flagged for lifestyle review.",
    tags: ["lab", "bloodwork"],
    source: "document",
    sensitivity: "sensitive",
    fhirResource: {
      resourceType: "DiagnosticReport",
      coding: [
        {
          code: "CBC",
          display: "Complete blood count"
        }
      ]
    },
    createdAt: "2026-05-16T11:25:00.000Z",
    updatedAt: "2026-05-16T11:25:00.000Z"
  },
  {
    id: "mock-3",
    ownerId: "demo-user",
    profileId: "demo-profile",
    type: "medication",
    title: "Metformin started",
    occurredAt: "2026-05-14T08:00:00.000Z",
    providerName: "Dr. Sharma",
    summary: "Metformin 500mg twice daily started for blood sugar control.",
    tags: ["medication", "diabetes"],
    source: "manual",
    sensitivity: "normal",
    fhirResource: {
      resourceType: "MedicationStatement",
      coding: [
        {
          code: "metformin",
          display: "Metformin"
        }
      ]
    },
    createdAt: "2026-05-14T08:10:00.000Z",
    updatedAt: "2026-05-14T08:10:00.000Z"
  },
  {
    id: "mock-4",
    ownerId: "demo-user",
    profileId: "demo-profile",
    type: "allergy",
    title: "Penicillin allergy recorded",
    occurredAt: "2026-04-22T10:00:00.000Z",
    summary: "Severe rash reaction noted. Avoid penicillin-class antibiotics unless reviewed.",
    tags: ["allergy", "safety"],
    source: "manual",
    sensitivity: "restricted",
    fhirResource: {
      resourceType: "AllergyIntolerance",
      coding: [
        {
          code: "penicillin",
          display: "Penicillin"
        }
      ]
    },
    createdAt: "2026-04-22T10:20:00.000Z",
    updatedAt: "2026-04-22T10:20:00.000Z"
  }
];
