import type {
  ApiHealthStatus,
  ApiSuccessResponse,
  AuthSessionResponse,
  AuthUser,
  ConsentGrant,
  ConsentLegalBasis,
  ConsentScope,
  DocumentCategory,
  DocumentShareLink,
  MedicalDocument,
  Medication,
  MedicationDoseSchedule,
  MedicationForm,
  MedicationReminderSettings,
  Notification,
  MedicationRoute,
  MedicationStatus,
  NotificationStatus,
  PaginatedMedicalDocuments,
  PaginatedMedications,
  PaginatedNotifications,
  PaginatedTimelineEvents,
  PatientProfile,
  TimelineEvent,
  TimelineEventSensitivity,
  TimelineEventType
} from "@medvault/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

type ApiErrorPayload = {
  error?: {
    message?: string;
    code?: string;
  };
};

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.error?.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

function shouldAttemptRefresh(path: string, response: Response) {
  return response.status === 401 && (path === "/auth/me" || !path.startsWith("/auth/"));
}

async function refreshAuthSession() {
  return fetch(`${API_URL}/auth/refresh`, {
    credentials: "include",
    headers: {
      Accept: "application/json"
    },
    method: "POST"
  });
}

async function fetchWithRefresh(path: string, init: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, init);

  if (!shouldAttemptRefresh(path, response)) {
    return response;
  }

  const refreshResponse = await refreshAuthSession();

  if (!refreshResponse.ok) {
    return response;
  }

  return fetch(`${API_URL}${path}`, init);
}

async function request<TData>(path: string): Promise<TData> {
  const response = await fetchWithRefresh(path, {
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccessResponse<TData>;

  return payload.data;
}

async function uploadRequest<TData>(path: string, formData: FormData): Promise<TData> {
  const response = await fetchWithRefresh(path, {
    body: formData,
    credentials: "include",
    method: "POST",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccessResponse<TData>;

  return payload.data;
}

async function postRequest<TData>(path: string, body?: unknown): Promise<TData> {
  const response = await fetchWithRefresh(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccessResponse<TData>;

  return payload.data;
}

async function patchRequest<TData>(path: string, body?: unknown): Promise<TData> {
  const response = await fetchWithRefresh(path, {
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccessResponse<TData>;

  return payload.data;
}

async function deleteRequest<TData>(path: string): Promise<TData> {
  const response = await fetchWithRefresh(path, {
    credentials: "include",
    headers: {
      Accept: "application/json"
    },
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccessResponse<TData>;

  return payload.data;
}

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
};

export async function getCurrentUser() {
  const data = await request<AuthSessionResponse>("/auth/me");

  return data.user;
}

export async function login(input: LoginInput) {
  const data = await postRequest<AuthSessionResponse>("/auth/login", input);

  return data.user;
}

export async function register(input: RegisterInput) {
  const data = await postRequest<AuthSessionResponse>("/auth/register", input);

  return data.user;
}

export async function logout() {
  return postRequest<{ loggedOut: boolean }>("/auth/logout");
}

export function getApiHealth() {
  return request<ApiHealthStatus>("/health");
}

export async function getPatientProfiles() {
  const data = await request<{ profiles: PatientProfile[] }>("/patient-profiles");

  return data.profiles;
}

export type CreatePatientProfileInput = {
  relationshipToOwner: PatientProfile["relationshipToOwner"];
  fullName: string;
  dateOfBirth: string;
  sexAtBirth: PatientProfile["sexAtBirth"];
  bloodGroup: PatientProfile["bloodGroup"];
  heightCm?: number;
  weightKg?: number;
  allergies: Array<{
    name: string;
    severity: "mild" | "moderate" | "severe" | "unknown";
  }>;
  chronicConditions: string[];
  emergencyContacts: [];
  primaryPhysicianName?: string;
  notes?: string;
};

export async function createPatientProfile(input: CreatePatientProfileInput) {
  const data = await postRequest<{ profile: PatientProfile }>("/patient-profiles", input);

  return data.profile;
}

export type UpdatePatientProfileInput = CreatePatientProfileInput & {
  profileId: string;
};

export async function updatePatientProfile({ profileId, ...input }: UpdatePatientProfileInput) {
  const data = await patchRequest<{ profile: PatientProfile }>(`/patient-profiles/${profileId}`, input);

  return data.profile;
}

export async function deletePatientProfile({ profileId }: { profileId: string }) {
  return deleteRequest<{ deleted: boolean }>(`/patient-profiles/${profileId}`);
}

type TimelineEventQuery = {
  profileId: string;
  type?: TimelineEventType | "all";
  q?: string;
  from?: string;
  to?: string;
};

export function getTimelineEvents({ profileId, type, q, from, to }: TimelineEventQuery) {
  const params = new URLSearchParams({
    page: "1",
    limit: "50",
    sort: "desc"
  });

  if (type && type !== "all") params.set("type", type);
  if (q) params.set("q", q);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return request<PaginatedTimelineEvents>(
    `/patient-profiles/${profileId}/timeline-events?${params.toString()}`
  );
}

export type CreateTimelineEventInput = {
  profileId: string;
  type: TimelineEventType;
  title: string;
  occurredAt: string;
  providerName?: string;
  facilityName?: string;
  summary?: string;
  tags: string[];
  source: "manual";
  sensitivity: TimelineEventSensitivity;
};

export async function createTimelineEvent({ profileId, ...input }: CreateTimelineEventInput) {
  const data = await postRequest<{ event: TimelineEvent }>(
    `/patient-profiles/${profileId}/timeline-events`,
    input
  );

  return data.event;
}

export type UpdateTimelineEventInput = CreateTimelineEventInput & {
  eventId: string;
};

export async function updateTimelineEvent({ profileId, eventId, ...input }: UpdateTimelineEventInput) {
  const data = await patchRequest<{ event: TimelineEvent }>(
    `/patient-profiles/${profileId}/timeline-events/${eventId}`,
    input
  );

  return data.event;
}

export async function deleteTimelineEvent({
  profileId,
  eventId
}: {
  profileId: string;
  eventId: string;
}) {
  return deleteRequest<{ deleted: boolean }>(`/patient-profiles/${profileId}/timeline-events/${eventId}`);
}

type MedicationQuery = {
  profileId: string;
  status?: "active" | "paused" | "completed" | "stopped" | "all";
  q?: string;
};

export function getMedications({ profileId, status = "all", q }: MedicationQuery) {
  const params = new URLSearchParams({
    page: "1",
    limit: "50",
    sort: "asc"
  });

  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);

  return request<PaginatedMedications>(`/patient-profiles/${profileId}/medications?${params.toString()}`);
}

export type CreateMedicationInput = {
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
  reminders: Pick<MedicationReminderSettings, "enabled" | "leadTimeMinutes">;
};

export async function createMedication({ profileId, ...input }: CreateMedicationInput) {
  const data = await postRequest<{ medication: Medication }>(
    `/patient-profiles/${profileId}/medications`,
    input
  );

  return data.medication;
}

export type UpdateMedicationInput = CreateMedicationInput & {
  medicationId: string;
};

export async function updateMedication({ profileId, medicationId, ...input }: UpdateMedicationInput) {
  const data = await patchRequest<{ medication: Medication }>(
    `/patient-profiles/${profileId}/medications/${medicationId}`,
    input
  );

  return data.medication;
}

export async function deleteMedication({
  profileId,
  medicationId
}: {
  profileId: string;
  medicationId: string;
}) {
  return deleteRequest<{ deleted: boolean }>(`/patient-profiles/${profileId}/medications/${medicationId}`);
}

type MedicalDocumentQuery = {
  profileId: string;
  category?: DocumentCategory | "all";
  q?: string;
  tags?: string;
};

export function getMedicalDocuments({ profileId, category, q, tags }: MedicalDocumentQuery) {
  const params = new URLSearchParams({
    page: "1",
    limit: "50",
    sort: "desc"
  });

  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  if (tags) params.set("tags", tags);

  return request<PaginatedMedicalDocuments>(
    `/patient-profiles/${profileId}/documents?${params.toString()}`
  );
}

export type UploadMedicalDocumentInput = {
  profileId: string;
  title: string;
  category: DocumentCategory;
  description?: string;
  tags?: string;
  timelineEventId?: string;
  file: File;
};

export async function uploadMedicalDocument({
  profileId,
  title,
  category,
  description,
  tags,
  timelineEventId,
  file
}: UploadMedicalDocumentInput) {
  const formData = new FormData();

  formData.set("file", file);
  formData.set("title", title);
  formData.set("category", category);
  if (description) formData.set("description", description);
  if (tags) formData.set("tags", tags);
  if (timelineEventId) formData.set("timelineEventId", timelineEventId);

  return uploadRequest<{ document: MedicalDocument }>(
    `/patient-profiles/${profileId}/documents`,
    formData
  );
}

export type CreateDocumentShareLinkInput = {
  profileId: string;
  documentId: string;
  recipientEmail?: string;
  recipientName?: string;
  purpose?: string;
  allowDownload: boolean;
  maxAccessCount: number;
  expiresAt: string;
};

export async function getDocumentShareLinks({
  profileId,
  documentId
}: {
  profileId: string;
  documentId: string;
}) {
  return request<{ shareLinks: DocumentShareLink[] }>(
    `/patient-profiles/${profileId}/documents/${documentId}/share-links`
  );
}

export async function createDocumentShareLink({
  profileId,
  documentId,
  ...input
}: CreateDocumentShareLinkInput) {
  return postRequest<{ shareLink: DocumentShareLink }>(
    `/patient-profiles/${profileId}/documents/${documentId}/share-links`,
    input
  );
}

export async function revokeDocumentShareLink({
  profileId,
  documentId,
  shareLinkId
}: {
  profileId: string;
  documentId: string;
  shareLinkId: string;
}) {
  return patchRequest<{ shareLink: DocumentShareLink }>(
    `/patient-profiles/${profileId}/documents/${documentId}/share-links/${shareLinkId}/revoke`
  );
}

export function getPublicShareLinkUrl(token: string) {
  return `${API_URL}/share-links/${token}`;
}

export type CreateConsentGrantInput = {
  profileId: string;
  documentId?: string;
  recipientName?: string;
  recipientEmail: string;
  purpose: string;
  legalBasis: ConsentLegalBasis;
  scopes: ConsentScope[];
  expiresAt: string;
};

export async function getConsentGrants({ profileId }: { profileId: string }) {
  return request<{ consents: ConsentGrant[] }>(`/patient-profiles/${profileId}/consents`);
}

export async function createConsentGrant({ profileId, ...input }: CreateConsentGrantInput) {
  return postRequest<{ consent: ConsentGrant }>(`/patient-profiles/${profileId}/consents`, input);
}

export async function withdrawConsentGrant({
  profileId,
  consentId,
  withdrawalReason
}: {
  profileId: string;
  consentId: string;
  withdrawalReason?: string;
}) {
  return patchRequest<{ consent: ConsentGrant }>(
    `/patient-profiles/${profileId}/consents/${consentId}/withdraw`,
    {
      withdrawalReason
    }
  );
}


type NotificationQuery = {
  status?: NotificationStatus | "all";
  type?: Notification["type"] | "all";
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
};

export function getNotifications({
  status = "all",
  type = "all",
  unreadOnly = false,
  page = 1,
  limit = 20
}: NotificationQuery = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    unreadOnly: String(unreadOnly)
  });

  if (status !== "all") params.set("status", status);
  if (type !== "all") params.set("type", type);

  return request<PaginatedNotifications>(`/notifications?${params.toString()}`);
}

export async function markNotificationRead({ notificationId }: { notificationId: string }) {
  const data = await patchRequest<{ notification: Notification }>(`/notifications/${notificationId}/read`);

  return data.notification;
}

export async function archiveNotification({ notificationId }: { notificationId: string }) {
  return deleteRequest<{ deleted: boolean }>(`/notifications/${notificationId}`);
}

export type { AuthUser };






