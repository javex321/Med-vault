import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

const consentGrantSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: "PatientProfile", required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: "MedicalDocument", default: null, index: true },
    recipientName: { type: String, trim: true, maxlength: 120 },
    recipientEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    legalBasis: {
      type: String,
      enum: ["treatment", "care_coordination", "insurance", "personal", "other"],
      required: true,
      default: "treatment"
    },
    scopes: {
      type: [String],
      enum: ["documents:read", "documents:download", "timeline:read", "medications:read"],
      required: true,
      default: ["documents:read"]
    },
    expiresAt: { type: Date, required: true, index: true },
    grantedAt: { type: Date, required: true, default: Date.now },
    withdrawnAt: { type: Date, default: null },
    withdrawalReason: { type: String, trim: true, maxlength: 500 }
  },
  {
    timestamps: true
  }
);

consentGrantSchema.index({ ownerId: 1, profileId: 1, createdAt: -1 });
consentGrantSchema.index({ ownerId: 1, profileId: 1, recipientEmail: 1 });

type ConsentGrantSchemaType = InferSchemaType<typeof consentGrantSchema>;

export type ConsentGrantDocument = HydratedDocument<ConsentGrantSchemaType> & {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  profileId: Types.ObjectId;
  documentId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

export const ConsentGrantModel = model("ConsentGrant", consentGrantSchema);
