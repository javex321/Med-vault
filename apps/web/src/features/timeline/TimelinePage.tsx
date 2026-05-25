import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  FileText,
  FlaskConical,
  Pill,
  Search,
  ShieldAlert,
  Stethoscope
} from "lucide-react";
import type { TimelineEvent, TimelineEventType } from "@medvault/shared";

import { getPatientProfiles, getTimelineEvents } from "../../lib/api";
import { mockTimelineEvents } from "./mockTimeline";

const typeOptions: Array<{ label: string; value: TimelineEventType | "all" }> = [
  { label: "All", value: "all" },
  { label: "Visits", value: "visit" },
  { label: "Labs", value: "lab_result" },
  { label: "Meds", value: "medication" },
  { label: "Allergies", value: "allergy" },
  { label: "Notes", value: "note" }
];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getEventIcon(type: TimelineEventType) {
  switch (type) {
    case "lab_result":
      return FlaskConical;
    case "medication":
      return Pill;
    case "allergy":
      return AlertTriangle;
    case "document":
      return FileText;
    case "visit":
      return Stethoscope;
    default:
      return Activity;
  }
}

function getTypeLabel(type: TimelineEventType) {
  return type
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function TimelineEventCard({
  event,
  selected,
  onSelect
}: {
  event: TimelineEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = getEventIcon(event.type);

  return (
    <button
      className={cn(
        "button-motion stagger-rise grid w-full grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-lg hover:shadow-slate-950/5 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-4",
        selected
          ? "border-teal-600 ring-2 ring-teal-100"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-800">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
            {getTypeLabel(event.type)}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {formatDate(event.occurredAt)} at {formatTime(event.occurredAt)}
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-slate-950">{event.title}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
          {event.summary ?? "No event summary recorded yet."}
        </p>
      </div>
    </button>
  );
}

function EventDetail({ event }: { event?: TimelineEvent }) {
  if (!event) {
    return (
      <aside className="soft-card border-dashed border-slate-300 p-6 text-center">
        <Activity className="mx-auto text-slate-300" size={32} />
        <p className="mt-3 text-sm font-bold text-slate-700">Select a timeline event</p>
        <p className="mt-1 text-sm text-slate-500">Details, tags, provider, and FHIR metadata appear here.</p>
      </aside>
    );
  }

  return (
    <aside className="soft-card interactive-card min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-teal-700">{getTypeLabel(event.type)}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">{event.title}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {event.sensitivity}
        </span>
      </div>

      <dl className="mt-6 grid gap-4">
        <div className="rounded-md bg-slate-50 p-4">
          <dt className="text-xs font-bold uppercase text-slate-500">When</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {formatDate(event.occurredAt)} at {formatTime(event.occurredAt)}
          </dd>
        </div>
        <div className="rounded-md bg-slate-50 p-4">
          <dt className="text-xs font-bold uppercase text-slate-500">Provider</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {event.providerName ?? event.facilityName ?? "Not recorded"}
          </dd>
        </div>
        <div className="rounded-md bg-slate-50 p-4">
          <dt className="text-xs font-bold uppercase text-slate-500">Summary</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-700">
            {event.summary ?? "No summary has been added for this event."}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase text-slate-500">Tags</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {event.fhirResource && (
        <div className="mt-5 rounded-md border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldAlert size={17} />
            FHIR metadata
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {event.fhirResource.resourceType}
            {event.fhirResource.coding[0]?.display ? ` - ${event.fhirResource.coding[0].display}` : ""}
          </p>
        </div>
      )}
    </aside>
  );
}

export function TimelinePage() {
  const [selectedType, setSelectedType] = useState<TimelineEventType | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(mockTimelineEvents[0]?.id);

  const profilesQuery = useQuery({
    queryKey: ["patient-profiles"],
    queryFn: getPatientProfiles,
    retry: false
  });

  const activeProfile = profilesQuery.data?.[0];

  const eventsQuery = useQuery({
    queryKey: ["timeline-events", activeProfile?.id, selectedType, search],
    queryFn: () =>
      getTimelineEvents({
        profileId: activeProfile?.id ?? "",
        type: selectedType,
        q: search || undefined
      }),
    enabled: Boolean(activeProfile?.id),
    retry: false
  });

  const liveEvents = eventsQuery.data?.events;
  const usingDemoData = !liveEvents;

  const events = useMemo(() => {
    const source = liveEvents ?? mockTimelineEvents;
    const loweredSearch = search.trim().toLowerCase();

    return source.filter((event) => {
      const matchesType = selectedType === "all" || event.type === selectedType;
      const matchesSearch =
        !loweredSearch ||
        event.title.toLowerCase().includes(loweredSearch) ||
        event.summary?.toLowerCase().includes(loweredSearch) ||
        event.tags.some((tag) => tag.toLowerCase().includes(loweredSearch));

      return matchesType && matchesSearch;
    });
  }, [liveEvents, search, selectedType]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];

  return (
    <div className="page-fade grid gap-6">
      <section className="soft-card interactive-card p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-bold text-teal-700">Timeline Workspace</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Medical history, organized by time</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review visits, labs, medications, documents, allergies, and notes in one profile-scoped view.
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">Data source</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {usingDemoData ? "Demo timeline" : activeProfile?.fullName ?? "Live profile"}
            </p>
          </div>
        </div>
      </section>

      <section className="soft-card interactive-card p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search timeline by title, note, or tag"
              value={search}
            />
          </label>

          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "button-motion h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition",
                  selectedType === option.value
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                onClick={() => {
                  setSelectedType(option.value);
                  setSelectedEventId(undefined);
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,420px)]">
        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <CalendarDays size={18} />
            {events.length} event{events.length === 1 ? "" : "s"}
          </div>

          {events.map((event) => (
            <TimelineEventCard
              event={event}
              key={event.id}
              onSelect={() => setSelectedEventId(event.id)}
              selected={selectedEvent?.id === event.id}
            />
          ))}

          {events.length === 0 && (
            <div className="soft-card border-dashed border-slate-300 p-8 text-center">
              <Activity className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-sm font-bold text-slate-700">No timeline events found</p>
              <p className="mt-1 text-sm text-slate-500">Try another filter or search term.</p>
            </div>
          )}
        </div>

        <EventDetail event={selectedEvent} />
      </section>
    </div>
  );
}
