import {
  Activity,
  Bell,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Home,
  LockKeyhole,
  LogOut,
  Menu,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { Medication, PatientProfile, TimelineEvent } from "@medvault/shared";

import {
  createMedication,
  createPatientProfile,
  deleteMedication,
  deletePatientProfile,
  deleteTimelineEvent,
  createTimelineEvent,
  getApiHealth,
  getCurrentUser,
  getMedications,
  getPatientProfiles,
  getTimelineEvents,
  login,
  logout,
  register,
  updateMedication,
  updatePatientProfile,
  updateTimelineEvent,
  type AuthUser,
  type CreateMedicationInput,
  type CreatePatientProfileInput,
  type CreateTimelineEventInput,
  type LoginInput,
  type RegisterInput,
  type UpdateMedicationInput,
  type UpdatePatientProfileInput,
  type UpdateTimelineEventInput
} from "./lib/api";
import { AuthPage } from "./features/auth/AuthPage";
import { ConsentPage } from "./features/consent/ConsentPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { MedicationForm } from "./features/medications/MedicationForm";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
import { PatientProfileForm } from "./features/patient-profile/PatientProfileForm";
import { TimelineEventForm } from "./features/timeline/TimelineEventForm";
import { TimelinePage } from "./features/timeline/TimelinePage";

const navItems = [
  { label: "Overview", icon: Home },
  { label: "Timeline", icon: Activity },
  { label: "Medications", icon: Pill },
  { label: "Documents", icon: FileText },
  { label: "Notifications", icon: Bell },
  { label: "Security", icon: ShieldCheck }
];

const defaultSection = "Overview";
const sectionBySlug = new Map(navItems.map((item) => [item.label.toLowerCase(), item.label]));

function getSectionSlug(section: string) {
  return section.toLowerCase().replace(/\s+/g, "-");
}

function getSectionFromLocation() {
  if (typeof window === "undefined") {
    return defaultSection;
  }

  const slug = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  return sectionBySlug.get(slug) ?? defaultSection;
}

function writeSectionToHistory(section: string, mode: "push" | "replace" = "push") {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.hash = section === defaultSection ? "" : getSectionSlug(section);

  const nextPath = `${url.pathname}${url.search}${url.hash}`;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextPath === currentPath) {
    return;
  }

  if (mode === "replace") {
    window.history.replaceState({ section }, "", nextPath);
    return;
  }

  window.history.pushState({ section }, "", nextPath);
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatTimelineType(type: TimelineEvent["type"]) {
  return type
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMedicationFrequency(frequency: Medication["schedule"]["frequency"]) {
  return frequency
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getTimelineDotClass(type: TimelineEvent["type"]) {
  switch (type) {
    case "medication":
      return "bg-amber-500";
    case "lab_result":
    case "document":
      return "bg-rose-500";
    case "visit":
      return "bg-teal-600";
    default:
      return "bg-slate-500";
  }
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div className="animate-pulse rounded-md border border-slate-100 bg-slate-50 p-4" key={item}>
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "h-2.5 w-2.5 rounded-full",
        online ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" : "bg-rose-500"
      )}
    />
  );
}

function Sidebar({
  activeSection,
  onSectionChange
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200/80 bg-white/95 px-5 py-6 shadow-[10px_0_35px_rgba(15,23,42,0.03)] backdrop-blur lg:sticky lg:top-0 lg:block">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-lg shadow-teal-900/20">
          <HeartPulse size={23} />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-950">MedVault</p>
          <p className="text-xs font-medium text-slate-500">Health timeline</p>
        </div>
      </div>

      <nav className="mt-9 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "button-motion flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition",
              activeSection === item.label
                ? "bg-teal-50 text-teal-900 shadow-inner shadow-teal-900/5"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
            onClick={() => onSectionChange(item.label)}
            type="button"
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-10 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <LockKeyhole size={17} />
          Secure Mode
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          httpOnly cookies, refresh-token rotation, profile-scoped permissions, and audit-friendly APIs are active.
        </p>
      </div>
    </aside>
  );
}


function MobileNavigation({
  activeSection,
  onClose,
  onSectionChange,
  open
}: {
  activeSection: string;
  onClose: () => void;
  onSectionChange: (section: string) => void;
  open: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <button
        aria-label="Close navigation backdrop"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside className="soft-pop absolute left-3 right-3 top-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-950/25">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-700 text-white">
              <HeartPulse size={21} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">MedVault</p>
              <p className="text-xs font-semibold text-slate-500">Secure health timeline</p>
            </div>
          </div>
          <button
            aria-label="Close navigation menu"
            className="button-motion rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-950"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="grid max-h-[70dvh] gap-2 overflow-y-auto p-3">
          {navItems.map((item) => (
            <button
              aria-label={`Go to ${item.label}`}
              className={cn(
                "button-motion flex h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-black",
                activeSection === item.label
                  ? "bg-teal-50 text-teal-900 shadow-inner"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )}
              key={item.label}
              onClick={() => {
                onSectionChange(item.label);
                onClose();
              }}
              type="button"
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
}
function Header({
  activeSection,
  canAddMedication,
  canAddTimeline,
  isLoggingOut,
  onAddMedication,
  onAddProfile,
  onAddTimeline,
  onLogout,
  onOpenMobileNav,
  onOpenNotifications,
  user
}: {
  activeSection: string;
  canAddMedication: boolean;
  canAddTimeline: boolean;
  isLoggingOut: boolean;
  onAddMedication: () => void;
  onAddProfile: () => void;
  onAddTimeline: () => void;
  onLogout: () => void;
  onOpenMobileNav: () => void;
  onOpenNotifications: () => void;
  user: AuthUser;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-3 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.04)] backdrop-blur sm:px-6 sm:py-4 lg:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-teal-700 sm:text-sm">Personal Health Timeline</p>
            <h1 className="mt-1 truncate text-2xl font-bold text-slate-950 sm:text-3xl">{activeSection}</h1>
          </div>
          <button
            aria-label="Open navigation menu"
            className="button-motion inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
            onClick={onOpenMobileNav}
            type="button"
          >
            <Menu size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap sm:items-center xl:justify-end">
          <div className="col-span-2 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:col-span-1">
            <span className="font-semibold text-slate-500">Signed in as </span>
            <span className="break-words font-bold text-slate-950">{user.name}</span>
          </div>
          <button
            className="button-motion inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4"
            onClick={onAddProfile}
            type="button"
          >
            <Plus size={17} />
            Add profile
          </button>
          <button
            className="button-motion inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-4"
            disabled={!canAddTimeline}
            onClick={onAddTimeline}
            title={canAddTimeline ? "Add a timeline event" : "Create a patient profile first"}
            type="button"
          >
            <Activity size={17} />
            Add timeline
          </button>
          <button
            className="button-motion inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-4"
            disabled={!canAddMedication}
            onClick={onAddMedication}
            title={canAddMedication ? "Add a medication schedule" : "Create a patient profile first"}
            type="button"
          >
            <Pill size={17} />
            Add medication
          </button>
          <button
            className="button-motion inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4"
            onClick={onOpenNotifications}
            type="button"
          >
            <Bell size={17} />
            Reminders
          </button>
          <button
            className="button-motion col-span-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 sm:col-span-1 sm:w-auto sm:px-4"
            disabled={isLoggingOut}
            onClick={onLogout}
            type="button"
          >
            <LogOut size={17} />
            {isLoggingOut ? "Logging out" : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
function ApiStatusPanel() {
  const healthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
    refetchInterval: 30_000,
    retry: false
  });

  const online = healthQuery.data?.status === "ok";

  return (
    <section className="soft-card interactive-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-950">API health</p>
          <p className="mt-1 text-sm text-slate-500">Live backend dependency status</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          <StatusDot online={online} />
          {online ? "Online" : "Offline"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">MongoDB</p>
          <p className="mt-1 text-lg font-bold text-slate-950">
            {healthQuery.data?.dependencies.mongo ?? "unknown"}
          </p>
        </div>
        <div className="rounded-md bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Redis</p>
          <p className="mt-1 text-lg font-bold text-slate-950">
            {healthQuery.data?.dependencies.redis ?? "unknown"}
          </p>
        </div>
      </div>
    </section>
  );
}

function SummaryGrid({
  activeMedsCount,
  isLoading,
  profilesCount,
  timelineCount
}: {
  activeMedsCount: number;
  isLoading: boolean;
  profilesCount: number;
  timelineCount: number;
}) {
  const stats = [
    { label: "Profiles", value: profilesCount, icon: UserRound, tone: "bg-teal-700" },
    { label: "Timeline items", value: timelineCount, icon: ClipboardList, tone: "bg-slate-900" },
    { label: "Active meds", value: activeMedsCount, icon: Pill, tone: "bg-amber-600" },
    { label: "Unread alerts", value: 0, icon: Bell, tone: "bg-rose-600" }
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <article key={stat.label} className="soft-card interactive-card stagger-rise p-5" style={{ animationDelay: `${index * 70}ms` }}>
          <div className="flex items-center justify-between">
            <div className={cn("grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg shadow-slate-950/10", stat.tone)}>
              <stat.icon size={19} />
            </div>
            <ChevronRight className="text-slate-300" size={18} />
          </div>
          <p className="mt-5 text-3xl font-bold text-slate-950">{isLoading ? "..." : stat.value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
        </article>
      ))}
    </section>
  );
}

function TimelinePreview({
  deletingEventId,
  error,
  events,
  isLoading,
  onDeleteEvent,
  onEditEvent
}: {
  deletingEventId?: string;
  error?: unknown;
  events: TimelineEvent[];
  isLoading: boolean;
  onDeleteEvent: (event: TimelineEvent) => void;
  onEditEvent: (event: TimelineEvent) => void;
}) {
  return (
    <section className="soft-card interactive-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">Recent timeline</p>
          <p className="mt-1 text-sm text-slate-500">Latest health events from MongoDB for the active profile</p>
        </div>
        <Activity className="text-teal-700" size={20} />
      </div>

      <div className="mt-5 space-y-4">
        {isLoading ? <LoadingRows /> : null}
        {!isLoading && error ? (
          <div className="rounded-md border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {getErrorMessage(error)}
          </div>
        ) : null}
        {!isLoading && !error && events.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No timeline events found yet. Use Add timeline to create one from the dashboard.
          </div>
        ) : null}
        {!isLoading && !error
          ? events.slice(0, 5).map((event) => (
              <article key={event.id} className="stagger-rise flex gap-3">
                <div className={cn("mt-1 h-3 w-3 rounded-full", getTimelineDotClass(event.type))} />
                <div className="min-w-0 flex-1 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-bold text-slate-950">{event.title}</p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {formatDate(event.occurredAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {event.summary ?? event.providerName ?? event.facilityName ?? "No summary recorded."}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      {formatTimelineType(event.type)}
                      {event.providerName ? ` - ${event.providerName}` : ""}
                    </p>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                      <button
                        className="button-motion h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                        onClick={() => onEditEvent(event)}
                        type="button"
                      >
                        Edit {event.title}
                      </button>
                      <button
                        className="button-motion h-9 w-full rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        disabled={deletingEventId === event.id}
                        onClick={() => onDeleteEvent(event)}
                        type="button"
                      >
                        {deletingEventId === event.id ? "Deleting..." : `Delete ${event.title}`}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          : null}
      </div>
    </section>
  );
}

function MedicationPanel({
  deletingMedicationId,
  error,
  isLoading,
  medications,
  onDeleteMedication,
  onEditMedication
}: {
  deletingMedicationId?: string;
  error?: unknown;
  isLoading: boolean;
  medications: Medication[];
  onDeleteMedication: (medication: Medication) => void;
  onEditMedication: (medication: Medication) => void;
}) {
  return (
    <section className="soft-card interactive-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">Medication schedule</p>
          <p className="mt-1 text-sm text-slate-500">Live medication plan saved through the backend</p>
        </div>
        <CalendarClock className="text-amber-600" size={20} />
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
        {isLoading ? <div className="p-4"><LoadingRows /></div> : null}
        {!isLoading && error ? (
          <div className="border-b border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {getErrorMessage(error)}
          </div>
        ) : null}
        {!isLoading && !error && medications.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">
            No medications found yet. Use Add medication to create one from the dashboard.
          </div>
        ) : null}
        {!isLoading && !error
          ? medications.map((medication) => (
              <div
                key={medication.id}
                className="interactive-card grid grid-cols-1 gap-3 border-b border-slate-200 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-bold text-slate-950">{medication.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[medication.strength, medication.form, medication.route].filter(Boolean).join(" - ")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatMedicationFrequency(medication.schedule.frequency)} at {medication.schedule.timesOfDay.join(", ")}
                  </p>
                  {medication.schedule.instructions ? (
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Instructions: {medication.schedule.instructions}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-end">
                  <span className="h-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
                    {medication.status}
                  </span>
                  <button
                    className="button-motion h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                    onClick={() => onEditMedication(medication)}
                    type="button"
                  >
                    Edit {medication.name}
                  </button>
                  <button
                    className="button-motion h-9 w-full rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={deletingMedicationId === medication.id}
                    onClick={() => onDeleteMedication(medication)}
                    type="button"
                  >
                    {deletingMedicationId === medication.id ? "Deleting..." : `Delete ${medication.name}`}
                  </button>
                </div>
              </div>
            ))
          : null}
      </div>
    </section>
  );
}

function ProfilePanel({
  deletingProfileId,
  error,
  isLoading,
  onDeleteProfile,
  onEditProfile,
  profile,
  user
}: {
  deletingProfileId?: string;
  error?: unknown;
  isLoading: boolean;
  onDeleteProfile: (profile: PatientProfile) => void;
  onEditProfile: (profile: PatientProfile) => void;
  profile?: PatientProfile;
  user: AuthUser;
}) {
  if (isLoading) {
    return (
      <section className="soft-card interactive-card p-5">
        <LoadingRows />
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-md border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-700 shadow-sm">
        {getErrorMessage(error)}
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded-md border border-dashed border-slate-300 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-slate-950 text-white">
            <Stethoscope size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">{user.name}</p>
            <p className="text-sm text-slate-500">No patient profile created yet</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="soft-card interactive-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-slate-950 text-white">
            <Stethoscope size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">{profile.fullName}</p>
            <p className="text-sm text-slate-500 capitalize">
              {profile.relationshipToOwner} profile - {profile.bloodGroup} - {profile.sexAtBirth.replaceAll("_", " ")}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            className="button-motion h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            onClick={() => onEditProfile(profile)}
            type="button"
          >
            Edit profile
          </button>
          <button
            className="button-motion h-9 w-full rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={deletingProfileId === profile.id}
            onClick={() => onDeleteProfile(profile)}
            type="button"
          >
            {deletingProfileId === profile.id ? "Deleting..." : "Delete profile"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-teal-50 p-4">
          <p className="text-xs font-bold uppercase text-teal-800">Allergies</p>
          <p className="mt-1 text-lg font-bold text-teal-950">{profile.allergies.length}</p>
        </div>
        <div className="rounded-md bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase text-amber-800">Conditions</p>
          <p className="mt-1 text-lg font-bold text-amber-950">{profile.chronicConditions.length}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600">
        <div className="rounded-md bg-slate-50 p-3">
          <span className="font-bold text-slate-900">DOB:</span> {formatDate(profile.dateOfBirth)}
          {profile.heightCm ? ` - Height: ${profile.heightCm}cm` : ""}
          {profile.weightKg ? ` - Weight: ${profile.weightKg}kg` : ""}
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <span className="font-bold text-slate-900">Conditions:</span>{" "}
          {profile.chronicConditions.length > 0 ? profile.chronicConditions.join(", ") : "None recorded"}
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <span className="font-bold text-slate-900">Allergies:</span>{" "}
          {profile.allergies.length > 0 ? profile.allergies.map((allergy) => allergy.name).join(", ") : "None recorded"}
        </div>
      </div>
    </section>
  );
}

export function App() {
  const [activeSection, setActiveSection] = useState(getSectionFromLocation);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PatientProfile | null>(null);
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<TimelineEvent | null>(null);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const queryClient = useQueryClient();

  const navigateToSection = useCallback((section: string, mode: "push" | "replace" = "push") => {
    setActiveSection(section);
    writeSectionToHistory(section, mode);
  }, []);

  useEffect(() => {
    const syncSectionFromBrowser = () => {
      setActiveSection(getSectionFromLocation());
    };

    window.addEventListener("popstate", syncSectionFromBrowser);
    window.addEventListener("hashchange", syncSectionFromBrowser);

    return () => {
      window.removeEventListener("popstate", syncSectionFromBrowser);
      window.removeEventListener("hashchange", syncSectionFromBrowser);
    };
  }, []);

  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false
  });

  const profilesQuery = useQuery({
    queryKey: ["patient-profiles"],
    queryFn: getPatientProfiles,
    enabled: Boolean(currentUserQuery.data),
    retry: false
  });

  const activeProfile = profilesQuery.data?.[0];

  const timelineQuery = useQuery({
    queryKey: ["dashboard", "timeline-events", activeProfile?.id],
    queryFn: () => getTimelineEvents({ profileId: activeProfile?.id ?? "" }),
    enabled: Boolean(activeProfile?.id),
    retry: false
  });

  const medicationsQuery = useQuery({
    queryKey: ["dashboard", "medications", activeProfile?.id],
    queryFn: () => getMedications({ profileId: activeProfile?.id ?? "" }),
    enabled: Boolean(activeProfile?.id),
    retry: false
  });

  const liveEvents = timelineQuery.data?.events ?? [];
  const liveMedications = medicationsQuery.data?.medications ?? [];
  const activeMedications = liveMedications.filter((medication) => medication.status === "active");
  const dashboardLoading = profilesQuery.isLoading || timelineQuery.isLoading || medicationsQuery.isLoading;

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
    }
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
    }
  });

  const createProfileMutation = useMutation({
    mutationFn: createPatientProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patient-profiles"] });
      setShowProfileForm(false);
      setEditingProfile(null);
      navigateToSection("Overview");
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: updatePatientProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patient-profiles"] });
      setShowProfileForm(false);
      setEditingProfile(null);
      navigateToSection("Overview");
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: deletePatientProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patient-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "timeline-events"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "medications"] });
      setShowProfileForm(false);
      setShowTimelineForm(false);
      setShowMedicationForm(false);
      setEditingProfile(null);
      setEditingTimelineEvent(null);
      setEditingMedication(null);
      navigateToSection("Overview");
    }
  });

  const createTimelineMutation = useMutation({
    mutationFn: createTimelineEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "timeline-events"] });
      void queryClient.invalidateQueries({ queryKey: ["timeline-events"] });
      setShowTimelineForm(false);
      setEditingTimelineEvent(null);
      navigateToSection("Overview");
    }
  });

  const updateTimelineMutation = useMutation({
    mutationFn: updateTimelineEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "timeline-events"] });
      void queryClient.invalidateQueries({ queryKey: ["timeline-events"] });
      setShowTimelineForm(false);
      setEditingTimelineEvent(null);
      navigateToSection("Overview");
    }
  });

  const deleteTimelineMutation = useMutation({
    mutationFn: deleteTimelineEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "timeline-events"] });
      void queryClient.invalidateQueries({ queryKey: ["timeline-events"] });
      setShowTimelineForm(false);
      setEditingTimelineEvent(null);
      navigateToSection("Overview");
    }
  });

  const createMedicationMutation = useMutation({
    mutationFn: createMedication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "medications"] });
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      setShowMedicationForm(false);
      setEditingMedication(null);
      navigateToSection("Overview");
    }
  });

  const updateMedicationMutation = useMutation({
    mutationFn: updateMedication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "medications"] });
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      setShowMedicationForm(false);
      setEditingMedication(null);
      navigateToSection("Overview");
    }
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: deleteMedication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "medications"] });
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      setShowMedicationForm(false);
      setEditingMedication(null);
      navigateToSection("Overview");
    }
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigateToSection("Overview");
    }
  });

  const authError = loginMutation.error ?? registerMutation.error;
  const isAuthSubmitting = loginMutation.isPending || registerMutation.isPending;

  if (currentUserQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef6f2] px-4 text-slate-950">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-2xl shadow-teal-950/10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-700 text-white">
            <HeartPulse size={28} />
          </div>
          <p className="mt-5 text-lg font-black">Checking secure session...</p>
          <p className="mt-2 text-sm font-medium text-slate-500">MedVault is asking the API if you are logged in.</p>
        </div>
      </main>
    );
  }

  if (!currentUserQuery.data) {
    return (
      <AuthPage
        errorMessage={authError ? getErrorMessage(authError) : undefined}
        isSubmitting={isAuthSubmitting}
        onLogin={(input: LoginInput) => loginMutation.mutate(input)}
        onRegister={(input: RegisterInput) => registerMutation.mutate(input)}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7f6] text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar activeSection={activeSection} onSectionChange={navigateToSection} />
        <div className="min-w-0 flex-1">
          <Header
            activeSection={activeSection}
            canAddMedication={Boolean(activeProfile?.id)}
            canAddTimeline={Boolean(activeProfile?.id)}
            isLoggingOut={logoutMutation.isPending}
            onAddProfile={() => {
              navigateToSection("Overview");
              setShowTimelineForm(false);
              setShowMedicationForm(false);
              setEditingProfile(null);
              setEditingTimelineEvent(null);
              setEditingMedication(null);
              setShowProfileForm(true);
            }}
            onAddTimeline={() => {
              navigateToSection("Overview");
              setShowProfileForm(false);
              setShowMedicationForm(false);
              setEditingProfile(null);
              setEditingTimelineEvent(null);
              setEditingMedication(null);
              setShowTimelineForm(true);
            }}
            onAddMedication={() => {
              navigateToSection("Overview");
              setShowProfileForm(false);
              setShowTimelineForm(false);
              setEditingProfile(null);
              setEditingTimelineEvent(null);
              setEditingMedication(null);
              setShowMedicationForm(true);
            }}
            onLogout={() => logoutMutation.mutate()}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onOpenNotifications={() => navigateToSection("Notifications")}
            user={currentUserQuery.data}
          />
          <MobileNavigation
            activeSection={activeSection}
            onClose={() => setMobileNavOpen(false)}
            onSectionChange={navigateToSection}
            open={mobileNavOpen}
          />
          <main className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            {activeSection === "Timeline" ? (
              <TimelinePage />
            ) : activeSection === "Documents" ? (
              <DocumentsPage />
            ) : activeSection === "Notifications" ? (
              <NotificationsPage />
            ) : activeSection === "Security" ? (
              <ConsentPage />
            ) : (
              <div className="page-fade grid gap-6">
                {showProfileForm ? (
                  <PatientProfileForm
                    errorMessage={
                      editingProfile
                        ? updateProfileMutation.error
                          ? getErrorMessage(updateProfileMutation.error)
                          : undefined
                        : createProfileMutation.error
                          ? getErrorMessage(createProfileMutation.error)
                          : undefined
                    }
                    isSubmitting={createProfileMutation.isPending || updateProfileMutation.isPending}
                    onCancel={() => {
                      setShowProfileForm(false);
                      setEditingProfile(null);
                    }}
                    onSubmit={(input: CreatePatientProfileInput) => {
                      if (editingProfile) {
                        updateProfileMutation.mutate({
                          ...input,
                          profileId: editingProfile.id
                        } satisfies UpdatePatientProfileInput);
                        return;
                      }

                      createProfileMutation.mutate(input);
                    }}
                    profile={editingProfile ?? undefined}
                  />
                ) : null}
                {showTimelineForm && activeProfile ? (
                  <TimelineEventForm
                    errorMessage={
                      editingTimelineEvent
                        ? updateTimelineMutation.error
                          ? getErrorMessage(updateTimelineMutation.error)
                          : undefined
                        : createTimelineMutation.error
                          ? getErrorMessage(createTimelineMutation.error)
                          : undefined
                    }
                    event={editingTimelineEvent ?? undefined}
                    isSubmitting={createTimelineMutation.isPending || updateTimelineMutation.isPending}
                    onCancel={() => {
                      setShowTimelineForm(false);
                      setEditingTimelineEvent(null);
                    }}
                    onSubmit={(input: CreateTimelineEventInput) => {
                      if (editingTimelineEvent) {
                        updateTimelineMutation.mutate({
                          ...input,
                          eventId: editingTimelineEvent.id
                        } satisfies UpdateTimelineEventInput);
                        return;
                      }

                      createTimelineMutation.mutate(input);
                    }}
                    profileId={activeProfile.id}
                  />
                ) : null}
                {showMedicationForm && activeProfile ? (
                  <MedicationForm
                    errorMessage={
                      editingMedication
                        ? updateMedicationMutation.error
                          ? getErrorMessage(updateMedicationMutation.error)
                          : undefined
                        : createMedicationMutation.error
                          ? getErrorMessage(createMedicationMutation.error)
                          : undefined
                    }
                    isSubmitting={createMedicationMutation.isPending || updateMedicationMutation.isPending}
                    medication={editingMedication ?? undefined}
                    onCancel={() => {
                      setShowMedicationForm(false);
                      setEditingMedication(null);
                    }}
                    onSubmit={(input: CreateMedicationInput) => {
                      if (editingMedication) {
                        updateMedicationMutation.mutate({
                          ...input,
                          medicationId: editingMedication.id
                        } satisfies UpdateMedicationInput);
                        return;
                      }

                      createMedicationMutation.mutate(input);
                    }}
                    profileId={activeProfile.id}
                  />
                ) : null}
                <SummaryGrid
                  activeMedsCount={activeMedications.length}
                  isLoading={dashboardLoading}
                  profilesCount={profilesQuery.data?.length ?? 0}
                  timelineCount={timelineQuery.data?.pagination.total ?? liveEvents.length}
                />
                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <TimelinePreview
                    deletingEventId={deleteTimelineMutation.isPending ? deleteTimelineMutation.variables?.eventId : undefined}
                    error={timelineQuery.error}
                    events={liveEvents}
                    isLoading={timelineQuery.isLoading}
                    onDeleteEvent={(event) => {
                      const confirmed = window.confirm(
                        `Delete ${event.title}? This archives the event and removes it from the active timeline.`
                      );

                      if (!confirmed) return;

                      deleteTimelineMutation.mutate({
                        profileId: event.profileId,
                        eventId: event.id
                      });
                    }}
                    onEditEvent={(event) => {
                      navigateToSection("Overview");
                      setShowProfileForm(false);
                      setShowMedicationForm(false);
                      setEditingMedication(null);
                      setEditingTimelineEvent(event);
                      setShowTimelineForm(true);
                    }}
                  />
                  <div className="page-fade grid gap-6">
                    <ApiStatusPanel />
                    <ProfilePanel
                      deletingProfileId={
                        deleteProfileMutation.isPending ? deleteProfileMutation.variables?.profileId : undefined
                      }
                      error={profilesQuery.error}
                      isLoading={profilesQuery.isLoading}
                      onDeleteProfile={(profile) => {
                        const confirmed = window.confirm(
                          `Delete ${profile.fullName}? This archives the profile and hides its active timeline and medication data.`
                        );

                        if (!confirmed) return;

                        deleteProfileMutation.mutate({ profileId: profile.id });
                      }}
                      onEditProfile={(profile) => {
                        navigateToSection("Overview");
                        setShowTimelineForm(false);
                        setShowMedicationForm(false);
                        setEditingTimelineEvent(null);
                        setEditingMedication(null);
                        setEditingProfile(profile);
                        setShowProfileForm(true);
                      }}
                      profile={activeProfile}
                      user={currentUserQuery.data}
                    />
                  </div>
                </div>
                <MedicationPanel
                  deletingMedicationId={
                    deleteMedicationMutation.isPending ? deleteMedicationMutation.variables?.medicationId : undefined
                  }
                  error={medicationsQuery.error}
                  isLoading={medicationsQuery.isLoading}
                  medications={liveMedications}
                  onDeleteMedication={(medication) => {
                    const confirmed = window.confirm(
                      `Delete ${medication.name}? This archives the medication and removes it from the active dashboard.`
                    );

                    if (!confirmed) return;

                    deleteMedicationMutation.mutate({
                      profileId: medication.profileId,
                      medicationId: medication.id
                    });
                  }}
                  onEditMedication={(medication) => {
                    navigateToSection("Overview");
                    setShowProfileForm(false);
                    setShowTimelineForm(false);
                    setEditingMedication(medication);
                    setShowMedicationForm(true);
                  }}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}






