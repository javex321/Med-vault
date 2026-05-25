import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

const notificationSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: "PatientProfile", default: null, index: true },
    type: {
      type: String,
      enum: ["medication_reminder", "timeline_update", "document_uploaded", "system", "security"],
      default: "system",
      required: true,
      index: true
    },
    channels: {
      type: [String],
      enum: ["in_app", "email"],
      required: true,
      default: ["in_app"]
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "read"],
      default: "queued",
      required: true,
      index: true
    },
    readAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, maxlength: 500 },
    metadata: { type: Map, of: String, default: {} },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

notificationSchema.index({ ownerId: 1, createdAt: -1 });
notificationSchema.index({ ownerId: 1, status: 1, createdAt: -1 });

type NotificationSchemaType = InferSchemaType<typeof notificationSchema>;

export type NotificationDocument = HydratedDocument<NotificationSchemaType> & {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  profileId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

export const NotificationModel = model("Notification", notificationSchema);
