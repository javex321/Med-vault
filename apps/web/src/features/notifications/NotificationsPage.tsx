import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Inbox,
  Mail,
  RefreshCw,
  ShieldAlert,
  Trash2
} from "lucide-react";
import type { Notification, NotificationStatus, NotificationType } from "@medvault/shared";

import { archiveNotification, getNotifications, markNotificationRead } from "../../lib/api";

const statusFilters: Array<{ label: string; value: NotificationStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Queued", value: "queued" },
  { label: "Sent", value: "sent" },
  { label: "Read", value: "read" },
  { label: "Failed", value: "failed" }
];

const typeLabels: Record<NotificationType, string> = {
  medication_reminder: "Medication reminder",
  timeline_update: "Timeline update",
  document_uploaded: "Document uploaded",
  system: "System",
  security: "Security"
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getStatusClass(status: NotificationStatus) {
  if (status === "read") return "bg-slate-100 text-slate-700";
  if (status === "sent") return "bg-emerald-50 text-emerald-700";
  if (status === "queued") return "bg-amber-50 text-amber-700";

  return "bg-rose-50 text-rose-700";
}

function NotificationSkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4" key={item}>
          <div className="h-3 w-1/4 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-5/6 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function NotificationCard({
  archivePending,
  markReadPending,
  notification,
  onArchive,
  onMarkRead
}: {
  archivePending: boolean;
  markReadPending: boolean;
  notification: Notification;
  onArchive: (notification: Notification) => void;
  onMarkRead: (notification: Notification) => void;
}) {
  const isUnread = !notification.readAt && notification.status !== "read";

  return (
    <article
      className={cn(
        "stagger-rise interactive-card rounded-2xl border bg-white p-4 shadow-sm transition",
        isUnread ? "border-teal-200 ring-4 ring-teal-50" : "border-slate-200"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-bold capitalize", getStatusClass(notification.status))}>
              {notification.status}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {typeLabels[notification.type]}
            </span>
            {notification.channels.map((channel) => (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200"
                key={channel}
              >
                {channel === "email" ? <Mail size={13} /> : <Inbox size={13} />}
                {channel === "email" ? "Email" : "In-app"}
              </span>
            ))}
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-950">{notification.title}</h2>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-600">{notification.message}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
            <span>Created {formatDateTime(notification.createdAt)}</span>
            {notification.sentAt ? <span>Sent {formatDateTime(notification.sentAt)}</span> : null}
            {notification.readAt ? <span>Read {formatDateTime(notification.readAt)}</span> : null}
          </div>

          {notification.failureReason ? (
            <div className="mt-4 flex gap-2 rounded-md border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              <ShieldAlert className="mt-0.5 shrink-0" size={16} />
              {notification.failureReason}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {isUnread ? (
            <button
              className="button-motion inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={markReadPending}
              onClick={() => onMarkRead(notification)}
              type="button"
            >
              <CheckCircle2 size={15} />
              {markReadPending ? "Marking..." : "Mark read"}
            </button>
          ) : null}
          <button
            className="button-motion inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={archivePending}
            onClick={() => onArchive(notification)}
            type="button"
          >
            <Trash2 size={15} />
            {archivePending ? "Archiving..." : "Archive"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<NotificationStatus | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", status, unreadOnly],
    queryFn: () =>
      getNotifications({
        limit: 50,
        status,
        unreadOnly
      }),
    retry: false
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: archiveNotification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt && notification.status !== "read").length,
    [notifications]
  );

  return (
    <div className="page-fade grid gap-6">
      <section className="soft-card overflow-hidden">
        <div className="grid gap-5 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-200">Notification center</p>
            <h2 className="mt-3 text-2xl font-black">Live alerts from your MedVault backend</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              These records come from MongoDB through the protected notification API. Email alerts move from queued to sent when the worker is running.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase text-slate-300">Total</p>
              <p className="mt-1 text-2xl font-black">{notificationsQuery.data?.pagination?.total ?? "..."}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase text-slate-300">Unread</p>
              <p className="mt-1 text-2xl font-black">{notificationsQuery.isLoading ? "..." : unreadCount}</p>
            </div>
            <button
              className="button-motion inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-400"
              onClick={() => void notificationsQuery.refetch()}
              type="button"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {statusFilters.map((option) => (
              <button
                className={cn(
                  "button-motion h-9 shrink-0 rounded-full px-4 text-xs font-black transition",
                  status === option.value
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                key={option.value}
                onClick={() => setStatus(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              checked={unreadOnly}
              className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              onChange={(event) => setUnreadOnly(event.target.checked)}
              type="checkbox"
            />
            Unread only
          </label>
        </div>
      </section>

      {notificationsQuery.isLoading ? <NotificationSkeleton /> : null}

      {!notificationsQuery.isLoading && notificationsQuery.error ? (
        <section className="soft-card flex gap-2 border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
          <AlertCircle className="mt-0.5 shrink-0" size={17} />
          {getErrorMessage(notificationsQuery.error)}
        </section>
      ) : null}

      {!notificationsQuery.isLoading && !notificationsQuery.error && notifications.length === 0 ? (
        <section className="soft-card border-dashed border-slate-300 p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-700">
            <BellRing size={22} />
          </div>
          <p className="mt-4 text-base font-black text-slate-950">No notifications found</p>
          <p className="mt-2 text-sm text-slate-500">
            Create a notification from the API or wait for reminders to generate alerts.
          </p>
        </section>
      ) : null}

      {!notificationsQuery.isLoading && !notificationsQuery.error && notifications.length > 0 ? (
        <section className="grid gap-3">
          {notifications.map((notification) => (
            <NotificationCard
              archivePending={archiveMutation.isPending && archiveMutation.variables?.notificationId === notification.id}
              key={notification.id}
              markReadPending={markReadMutation.isPending && markReadMutation.variables?.notificationId === notification.id}
              notification={notification}
              onArchive={(item) => archiveMutation.mutate({ notificationId: item.id })}
              onMarkRead={(item) => markReadMutation.mutate({ notificationId: item.id })}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}