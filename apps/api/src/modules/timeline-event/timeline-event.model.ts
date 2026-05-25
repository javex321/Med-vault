import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

const codingSchema = new Schema(
  {
    system: { type: String, trim: true },
    code: { type: String, required: true, trim: true, maxlength: 80 },
    display: { type: String, trim: true, maxlength: 160 }
  },
  { _id: false }
);

const fhirResourceSchema = new Schema(
  {
    resourceType: {
      type: String,
      enum: [
        "AllergyIntolerance",
        "Condition",
        "DiagnosticReport",
        "DocumentReference",
        "Encounter",
        "Immunization",
        "MedicationStatement",
        "Observation",
        "Procedure"
      ],
      required: true
    },
    resourceId: { type: String, trim: true, maxlength: 120 },
    coding: { type: [codingSchema], default: [] }
  },
  { _id: false }
);

const timelineEventSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "visit",
        "lab_result",
        "diagnosis",
        "procedure",
        "medication",
        "immunization",
        "allergy",
        "vital",
        "document",
        "note"
      ],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    occurredAt: {
      type: Date,
      required: true,
      index: true
    },
    endedAt: {
      type: Date,
      default: null
    },
    providerName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    facilityName: {
      type: String,
      trim: true,
      maxlength: 160
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    source: {
      type: String,
      enum: ["manual", "document", "import", "fhir"],
      default: "manual",
      required: true
    },
    sensitivity: {
      type: String,
      enum: ["normal", "sensitive", "restricted"],
      default: "normal",
      required: true
    },
    fhirResource: {
      type: fhirResourceSchema,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

timelineEventSchema.index({ ownerId: 1, profileId: 1, occurredAt: -1 });
timelineEventSchema.index({ ownerId: 1, profileId: 1, type: 1, occurredAt: -1 });
timelineEventSchema.index({ title: "text", summary: "text", providerName: "text", facilityName: "text" });

type TimelineEventSchemaType = InferSchemaType<typeof timelineEventSchema>;

export type TimelineEventDocument = HydratedDocument<TimelineEventSchemaType> & {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  profileId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const TimelineEventModel = model("TimelineEvent", timelineEventSchema);
