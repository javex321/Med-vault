import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

const documentShareLinkSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: "PatientProfile", required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: "MedicalDocument", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    recipientName: { type: String, trim: true, maxlength: 120 },
    recipientEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
    purpose: { type: String, trim: true, maxlength: 500 },
    allowDownload: { type: Boolean, required: true, default: false },
    maxAccessCount: { type: Number, required: true, min: 1, max: 100, default: 10 },
    accessCount: { type: Number, required: true, min: 0, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    lastAccessedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

documentShareLinkSchema.index({ ownerId: 1, profileId: 1, documentId: 1, createdAt: -1 });

type DocumentShareLinkSchemaType = InferSchemaType<typeof documentShareLinkSchema>;

export type DocumentShareLinkDocument = HydratedDocument<DocumentShareLinkSchemaType> & {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  profileId: Types.ObjectId;
  documentId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const DocumentShareLinkModel = model("DocumentShareLink", documentShareLinkSchema);
