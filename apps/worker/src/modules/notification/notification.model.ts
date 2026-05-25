import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "read"],
      required: true
    },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, maxlength: 500 }
  },
  {
    timestamps: true,
    strict: false
  }
);

export const NotificationModel = model("Notification", notificationSchema);
