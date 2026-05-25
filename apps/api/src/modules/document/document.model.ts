import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

const medicalDocumentSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: "PatientProfile", required: true, index: true },
    timelineEventId: {
      type: Schema.Types.ObjectId,
      ref: "TimelineEvent",
      default: null,
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: {
      type: String,
      enum: [
        "lab_report",
        "prescription",
        "doctor_note",
        "imaging",
        "insurance",
        "vaccination",
        "discharge_summary",
        "other"
      ],
      default: "other",
      required: true,
      index: true
    },
    description: { type: String, trim: true, maxlength: 1000 },
    originalFileName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, required: true, min: 1 },
    checksumSha256: { type: String, required: true, index: true },
    storageProvider: { type: String, enum: ["local", "s3", "cloudinary"], required: true },
    storageKey: { type: String, required: true, trim: true, index: true },
    storageUrl: { type: String, trim: true },
    tags: { type: [String], default: [], index: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
    archivedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

medicalDocumentSchema.index({ ownerId: 1, profileId: 1, uploadedAt: -1 });
medicalDocumentSchema.index({ ownerId: 1, profileId: 1, category: 1, uploadedAt: -1 });
medicalDocumentSchema.index({ title: "text", description: "text", originalFileName: "text" });

type MedicalDocumentSchemaType = InferSchemaType<typeof medicalDocumentSchema>;

export type MedicalDocumentDocument = HydratedDocument<MedicalDocumentSchemaType> & {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  profileId: Types.ObjectId;
  timelineEventId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

export const MedicalDocumentModel = model("MedicalDocument", medicalDocumentSchema);
