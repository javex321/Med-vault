export const APP_NAME = "MedVault";

export type DependencyStatus = "connected" | "disconnected";

export type ApiHealthStatus = {
  status: "ok" | "degraded";
  service: "api";
  timestamp: string;
  uptime: number;
  dependencies: {
    mongo: DependencyStatus;
    redis: DependencyStatus;
  };
};

export type ApiLivenessStatus = {
  status: "alive";
  service: "api";
  timestamp: string;
  uptime: number;
};

export type ApiReadinessStatus = {
  status: "ready" | "not_ready";
  service: "api";
  timestamp: string;
  uptime: number;
  dependencies: ApiHealthStatus["dependencies"];
};

export type ApiSuccessResponse<TData> = {
  success: true;
  requestId: string;
  data: TData;
};

export type ApiErrorResponse = {
  success: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
};

export type UserRole = "patient" | "family_member" | "clinician" | "admin";

export type Permission =
  | "profile:read"
  | "profile:update"
  | "timeline:read"
  | "timeline:create"
  | "timeline:update"
  | "medications:read"
  | "medications:create"
  | "medications:update"
  | "notifications:read"
  | "notifications:update"
  | "documents:read"
  | "documents:upload"
  | "documents:update"
  | "sharing:create"
  | "consent:manage"
  | "audit:read";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "locked" | "disabled";
};

export type AuthSessionResponse = {
  user: AuthUser;
};

export type PatientProfileRelation = "self" | "child" | "parent" | "spouse" | "other";

export type SexAtBirth = "female" | "male" | "intersex" | "unknown" | "prefer_not_to_say";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";

export type Allergy = {
  name: string;
  reaction?: string;
  severity: "mild" | "moderate" | "severe" | "unknown";
  notes?: string;
};

export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
};

export type PatientProfile = {
  id: string;
  ownerId: string;
  relationshipToOwner: PatientProfileRelation;
  fullName: string;
  dateOfBirth: string;
  sexAtBirth: SexAtBirth;
  bloodGroup: BloodGroup;
  heightCm?: number;
  weightKg?: number;
  allergies: Allergy[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  primaryPhysicianName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TimelineEventType =
  | "visit"
  | "lab_result"
  | "diagnosis"
  | "procedure"
  | "medication"
  | "immunization"
  | "allergy"
  | "vital"
  | "document"
  | "note";

export type TimelineEventSource = "manual" | "document" | "import" | "fhir";

export type TimelineEventSensitivity = "normal" | "sensitive" | "restricted";

export type FhirResourceType =
  | "AllergyIntolerance"
  | "Condition"
  | "DiagnosticReport"
  | "DocumentReference"
  | "Encounter"
  | "Immunization"
  | "MedicationStatement"
  | "Observation"
  | "Procedure";

export type FhirCoding = {
  system?: string;
  code: string;
  display?: string;
};

export type TimelineEventFhirResource = {
  resourceType: FhirResourceType;
  resourceId?: string;
  coding: FhirCoding[];
};

export type TimelineEvent = {
  id: string;
  ownerId: string;
  profileId: string;
  type: TimelineEventType;
  title: string;
  occurredAt: string;
  endedAt?: string;
  providerName?: string;
  facilityName?: string;
  summary?: string;
  tags: string[];
  source: TimelineEventSource;
  sensitivity: TimelineEventSensitivity;
  fhirResource?: TimelineEventFhirResource;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedTimelineEvents = {
  events: TimelineEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type MedicationStatus = "active" | "paused" | "completed" | "stopped";

export type MedicationForm =
  | "tablet"
  | "capsule"
  | "liquid"
  | "injection"
  | "inhaler"
  | "cream"
  | "drops"
  | "patch"
  | "other";

export type MedicationRoute =
  | "oral"
  | "topical"
  | "inhaled"
  | "injection"
  | "intranasal"
  | "ophthalmic"
  | "otic"
  | "other";

export type MedicationDoseSchedule = {
  doseAmount: number;
  doseUnit: string;
  frequency: "once_daily" | "twice_daily" | "three_times_daily" | "four_times_daily" | "as_needed" | "custom";
  timesOfDay: string[];
  daysOfWeek: number[];
  startDate: string;
  endDate?: string;
  timezone: string;
  instructions?: string;
};

export type MedicationReminderSettings = {
  enabled: boolean;
  leadTimeMinutes: number;
  nextReminderAt?: string;
};

export type MedicationAdherenceStatus = "taken" | "missed" | "skipped";

export type MedicationAdherenceLog = {
  id: string;
  scheduledFor: string;
  status: MedicationAdherenceStatus;
  recordedAt: string;
  doseAmount?: number;
  doseUnit?: string;
  note?: string;
};

export type Medication = {
  id: string;
  ownerId: string;
  profileId: string;
  name: string;
  genericName?: string;
  form: MedicationForm;
  route: MedicationRoute;
  strength?: string;
  reason?: string;
  prescribingClinician?: string;
  status: MedicationStatus;
  schedule: MedicationDoseSchedule;
  reminders: MedicationReminderSettings;
  adherenceLogs: MedicationAdherenceLog[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedMedications = {
  medications: Medication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DocumentCategory =
  | "lab_report"
  | "prescription"
  | "doctor_note"
  | "imaging"
  | "insurance"
  | "vaccination"
  | "discharge_summary"
  | "other";

export type DocumentStorageProvider = "local" | "s3" | "cloudinary";

export type MedicalDocument = {
  id: string;
  ownerId: string;
  profileId: string;
  timelineEventId?: string;
  title: string;
  category: DocumentCategory;
  description?: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  storageProvider: DocumentStorageProvider;
  storageKey: string;
  storageUrl?: string;
  tags: string[];
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedMedicalDocuments = {
  documents: MedicalDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ShareLinkStatus = "active" | "expired" | "revoked" | "exhausted";

export type DocumentShareLink = {
  id: string;
  ownerId: string;
  profileId: string;
  documentId: string;
  token?: string;
  recipientName?: string;
  recipientEmail?: string;
  purpose?: string;
  allowDownload: boolean;
  maxAccessCount: number;
  accessCount: number;
  status: ShareLinkStatus;
  expiresAt: string;
  lastAccessedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicSharedDocument = Pick<
  MedicalDocument,
  | "id"
  | "title"
  | "category"
  | "description"
  | "originalFileName"
  | "mimeType"
  | "sizeBytes"
  | "checksumSha256"
  | "tags"
  | "uploadedAt"
>;

export type PublicDocumentShareLink = {
  id: string;
  document: PublicSharedDocument;
  allowDownload: boolean;
  accessCount: number;
  maxAccessCount: number;
  expiresAt: string;
};

export type ConsentScope = "documents:read" | "documents:download" | "timeline:read" | "medications:read";

export type ConsentLegalBasis = "treatment" | "care_coordination" | "insurance" | "personal" | "other";

export type ConsentStatus = "active" | "expired" | "withdrawn";

export type ConsentGrant = {
  id: string;
  ownerId: string;
  profileId: string;
  documentId?: string;
  recipientName?: string;
  recipientEmail: string;
  purpose: string;
  legalBasis: ConsentLegalBasis;
  scopes: ConsentScope[];
  status: ConsentStatus;
  expiresAt: string;
  grantedAt: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationChannel = "in_app" | "email";

export type NotificationType =
  | "medication_reminder"
  | "timeline_update"
  | "document_uploaded"
  | "system"
  | "security";

export type NotificationStatus = "queued" | "sent" | "failed" | "read";

export type Notification = {
  id: string;
  ownerId: string;
  profileId?: string;
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  message: string;
  status: NotificationStatus;
  readAt?: string;
  sentAt?: string;
  failedAt?: string;
  failureReason?: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedNotifications = {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EmailJobPayload = {
  notificationId: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
};
