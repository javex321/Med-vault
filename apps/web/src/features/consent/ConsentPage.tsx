import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, FileCheck2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ConsentGrant, ConsentLegalBasis, ConsentScope, ConsentStatus } from "@medvault/shared";
import { z } from "zod";

import { createConsentGrant, getConsentGrants, getPatientProfiles, withdrawConsentGrant } from "../../lib/api";
import { mockConsents } from "./mockConsents";

const consentFormSchema = z.object({
  recipientName: z.string().trim().max(120).optional(),
  recipientEmail: z.string().trim().email("Enter a valid recipient email"),
  purpose: z.string().trim().min(3, "Purpose is required").max(500),
  legalBasis: z.enum(["treatment", "care_coordination", "insurance", "personal", "other"]),
  expiresInDays: z.coerce.number().int().min(1).max(365),
  documentsRead: z.boolean().optional(),
  documentsDownload: z.boolean().optional(),
  timelineRead: z.boolean().optional(),
  medicationsRead: z.boolean().optional()
});

type ConsentFormValues = z.infer<typeof consentFormSchema>;

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

function getStatusClass(status: ConsentStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "withdrawn") return "bg-rose-50 text-rose-700";

  return "bg-amber-50 text-amber-700";
}

function getLegalBasisLabel(value: ConsentLegalBasis) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function toScopes(values: ConsentFormValues): ConsentScope[] {
  const scopes: ConsentScope[] = [];

  if (values.documentsRead) scopes.push("documents:read");
  if (values.documentsDownload) scopes.push("documents:download");
  if (values.timelineRead) scopes.push("timeline:read");
  if (values.medicationsRead) scopes.push("medications:read");

  return scopes.length > 0 ? scopes : ["documents:read"];
}

function ConsentCard({
  consent,
  liveProfileId,
  onWithdraw
}: {
  consent: ConsentGrant;
  liveProfileId?: string;
  onWithdraw: (input: { profileId: string; consentId: string }) => void;
}) {
  return (
    <article className="soft-card interactive-card stagger-rise p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">{consent.recipientName ?? consent.recipientEmail}</p>
          <p className="mt-1 break-all text-sm text-slate-500">{consent.recipientEmail}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", getStatusClass(consent.status))}>
          {consent.status}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{consent.purpose}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase text-slate-500">Legal basis</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{getLegalBasisLabel(consent.legalBasis)}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase text-slate-500">Expires</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(consent.expiresAt)}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase text-slate-500">Scopes</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{consent.scopes.length}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {consent.scopes.map((scope) => (
          <span key={scope} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
            {scope}
          </span>
        ))}
      </div>

      {consent.withdrawalReason && (
        <p className="mt-4 rounded-md border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          Withdrawal reason: {consent.withdrawalReason}
        </p>
      )}

      {consent.status === "active" && liveProfileId && !consent.id.startsWith("consent-demo-") && (
        <button
          className="button-motion mt-4 h-9 w-full rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 sm:w-auto"
          onClick={() => onWithdraw({ profileId: liveProfileId, consentId: consent.id })}
          type="button"
        >
          Withdraw consent
        </button>
      )}
    </article>
  );
}

export function ConsentPage() {
  const queryClient = useQueryClient();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError
  } = useForm<ConsentFormValues>({
    defaultValues: {
      documentsDownload: false,
      documentsRead: true,
      expiresInDays: 30,
      legalBasis: "treatment",
      medicationsRead: false,
      purpose: "",
      recipientEmail: "",
      recipientName: "",
      timelineRead: false
    }
  });

  const profilesQuery = useQuery({
    queryKey: ["patient-profiles"],
    queryFn: getPatientProfiles,
    retry: false
  });

  const activeProfile = profilesQuery.data?.[0];

  const consentsQuery = useQuery({
    queryKey: ["consents", activeProfile?.id],
    queryFn: () => getConsentGrants({ profileId: activeProfile?.id ?? "" }),
    enabled: Boolean(activeProfile?.id),
    retry: false
  });

  const createMutation = useMutation({
    mutationFn: createConsentGrant,
    onSuccess: () => {
      reset();
      void queryClient.invalidateQueries({ queryKey: ["consents"] });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: withdrawConsentGrant,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["consents"] });
    }
  });

  const liveConsents = consentsQuery.data?.consents;
  const consents = liveConsents ?? mockConsents;
  const usingDemoData = !liveConsents;
  const activeCount = useMemo(() => consents.filter((consent) => consent.status === "active").length, [consents]);

  function onSubmit(values: ConsentFormValues) {
    const parsed = consentFormSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && field in values) {
          setError(field as keyof ConsentFormValues, {
            message: issue.message,
            type: "manual"
          });
        }
      }

      return;
    }

    if (!activeProfile?.id) {
      setError("recipientEmail", {
        message: "Sign in and select a live patient profile before creating consent.",
        type: "manual"
      });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

    createMutation.mutate({
      profileId: activeProfile.id,
      recipientName: parsed.data.recipientName || undefined,
      recipientEmail: parsed.data.recipientEmail,
      purpose: parsed.data.purpose,
      legalBasis: parsed.data.legalBasis,
      scopes: toScopes(parsed.data),
      expiresAt: expiresAt.toISOString()
    });
  }

  return (
    <div className="page-fade grid gap-6">
      <section className="soft-card interactive-card p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-bold text-teal-700">Consent Ledger</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Patient-controlled access consent</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Track who is allowed to access health information, why access was granted, which scopes are allowed,
              and whether consent is active, expired, or withdrawn.
            </p>
          </div>
          <div className="grid gap-3 rounded-md bg-slate-50 px-4 py-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Data source</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {usingDemoData ? "Demo consent" : activeProfile?.fullName ?? "Live profile"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Active grants</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{activeCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        <form className="soft-card interactive-card p-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-950">Grant consent</p>
              <p className="mt-1 text-sm text-slate-500">Record explicit access authorization.</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-md bg-teal-50 text-teal-800">
              <ShieldCheck size={19} />
            </div>
          </div>

          {!activeProfile?.id && (
            <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              Consent creation is disabled in demo mode until an authenticated profile is available.
            </div>
          )}

          <div className="mt-5 grid gap-4">
            <label className="grid gap-1">
              <span className="text-xs font-bold uppercase text-slate-500">Recipient email</span>
              <input
                className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="doctor@example.com"
                {...register("recipientEmail")}
              />
              {errors.recipientEmail?.message && (
                <span className="text-xs font-semibold text-rose-600">{errors.recipientEmail.message}</span>
              )}
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-bold uppercase text-slate-500">Recipient name</span>
              <input
                className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="Dr. Meera Sharma"
                {...register("recipientName")}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-bold uppercase text-slate-500">Purpose</span>
              <textarea
                className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="Specialist review before appointment"
                {...register("purpose")}
              />
              {errors.purpose?.message && (
                <span className="text-xs font-semibold text-rose-600">{errors.purpose.message}</span>
              )}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase text-slate-500">Legal basis</span>
                <select
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  {...register("legalBasis")}
                >
                  <option value="treatment">Treatment</option>
                  <option value="care_coordination">Care coordination</option>
                  <option value="insurance">Insurance</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase text-slate-500">Expires in days</span>
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  max={365}
                  min={1}
                  type="number"
                  {...register("expiresInDays")}
                />
              </label>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Scopes</p>
              <div className="mt-2 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("documentsRead")} />
                  Documents read
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("documentsDownload")} />
                  Documents download
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("timelineRead")} />
                  Timeline read
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("medicationsRead")} />
                  Medications read
                </label>
              </div>
            </div>

            {createMutation.isError && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                Consent creation failed. Check authentication and backend availability.
              </div>
            )}

            <button
              className="button-motion inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              disabled={!activeProfile?.id || createMutation.isPending}
              type="submit"
            >
              <FileCheck2 size={17} />
              {createMutation.isPending ? "Saving..." : "Grant consent"}
            </button>
          </div>
        </form>

        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <ShieldAlert size={18} />
            {consents.length} consent grant{consents.length === 1 ? "" : "s"}
          </div>

          {consents.map((consent) => (
            <ConsentCard
              consent={consent}
              key={consent.id}
              liveProfileId={activeProfile?.id}
              onWithdraw={({ profileId, consentId }) =>
                withdrawMutation.mutate({
                  profileId,
                  consentId,
                  withdrawalReason: "Withdrawn from MedVault dashboard"
                })
              }
            />
          ))}

          {consents.length === 0 && (
            <div className="soft-card border-dashed border-slate-300 p-8 text-center">
              <CheckCircle2 className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-sm font-bold text-slate-700">No consent grants yet</p>
              <p className="mt-1 text-sm text-slate-500">Create consent before sharing sensitive health data.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
