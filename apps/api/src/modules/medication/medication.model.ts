import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

const scheduleSchema = new Schema(
  {
    doseAmount: { type: Number, required: true, min: 0 },
    doseUnit: { type: String, required: true, trim: true, maxlength: 40 },
    frequency: {
      type: String,
      enum: ["once_daily", "twice_daily", "three_times_daily", "four_times_daily", "as_needed", "custom"],
      default: "once_daily",
      required: true
    },
    timesOfDay: { type: [String], default: [] },
    daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    timezone: { type: String, required: true, trim: true, default: "Asia/Kolkata", maxlength: 80 },
    instructions: { type: String, trim: true, maxlength: 1000 }
  },
  { _id: false }
);

const reminderSchema = new Schema(
  {
    enabled: { type: Boolean, default: false, required: true },
    leadTimeMinutes: { type: Number, default: 15, min: 0, max: 240, required: true },
    nextReminderAt: { type: Date, default: null, index: true }
  },
  { _id: false }
);

const adherenceLogSchema = new Schema(
  {
    scheduledFor: { type: Date, required: true, index: true },
    status: { type: String, enum: ["taken", "missed", "skipped"], required: true },
    recordedAt: { type: Date, required: true },
    doseAmount: { type: Number, min: 0 },
    doseUnit: { type: String, trim: true, maxlength: 40 },
    note: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

const medicationSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: "PatientProfile", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    genericName: { type: String, trim: true, maxlength: 160 },
    form: {
      type: String,
      enum: ["tablet", "capsule", "liquid", "injection", "inhaler", "cream", "drops", "patch", "other"],
      default: "tablet",
      required: true
    },
    route: {
      type: String,
      enum: ["oral", "topical", "inhaled", "injection", "intranasal", "ophthalmic", "otic", "other"],
      default: "oral",
      required: true
    },
    strength: { type: String, trim: true, maxlength: 80 },
    reason: { type: String, trim: true, maxlength: 240 },
    prescribingClinician: { type: String, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "stopped"],
      default: "active",
      required: true,
      index: true
    },
    schedule: { type: scheduleSchema, required: true },
    reminders: { type: reminderSchema, required: true, default: () => ({}) },
    adherenceLogs: { type: [adherenceLogSchema], default: [] },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

medicationSchema.index({ ownerId: 1, profileId: 1, status: 1, name: 1 });
medicationSchema.index({ ownerId: 1, profileId: 1, "reminders.nextReminderAt": 1 });
medicationSchema.index({ name: "text", genericName: "text", reason: "text", prescribingClinician: "text" });

type MedicationSchemaType = InferSchemaType<typeof medicationSchema>;

export type MedicationDocument = HydratedDocument<MedicationSchemaType> & {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  profileId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const MedicationModel = model("Medication", medicationSchema);
