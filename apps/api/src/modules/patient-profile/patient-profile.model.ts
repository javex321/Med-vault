import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

const allergySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    reaction: { type: String, trim: true, maxlength: 240 },
    severity: {
      type: String,
      enum: ["mild", "moderate", "severe", "unknown"],
      default: "unknown",
      required: true
    },
    notes: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const emergencyContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    relationship: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true }
  },
  { _id: false }
);

const patientProfileSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    relationshipToOwner: {
      type: String,
      enum: ["self", "child", "parent", "spouse", "other"],
      default: "self",
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    sexAtBirth: {
      type: String,
      enum: ["female", "male", "intersex", "unknown", "prefer_not_to_say"],
      required: true
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
      required: true
    },
    heightCm: {
      type: Number,
      min: 30,
      max: 260
    },
    weightKg: {
      type: Number,
      min: 1,
      max: 400
    },
    allergies: {
      type: [allergySchema],
      default: []
    },
    chronicConditions: {
      type: [String],
      default: []
    },
    emergencyContacts: {
      type: [emergencyContactSchema],
      default: []
    },
    primaryPhysicianName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
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

patientProfileSchema.index({ ownerId: 1, relationshipToOwner: 1 });
patientProfileSchema.index({ ownerId: 1, fullName: 1 });

type PatientProfileSchemaType = InferSchemaType<typeof patientProfileSchema>;

export type PatientProfileDocument = HydratedDocument<PatientProfileSchemaType> & {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PatientProfileModel = model("PatientProfile", patientProfileSchema);
