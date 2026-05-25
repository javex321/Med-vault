import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  CalendarDays,
  Copy,
  Database,
  FileArchive,
  FileImage,
  FileText,
  Link2,
  Search,
  ShieldCheck,
  Tags,
  UploadCloud
} from "lucide-react";
import type { DocumentCategory, DocumentShareLink, MedicalDocument } from "@medvault/shared";
import { z } from "zod";

import {
  createDocumentShareLink,
  getDocumentShareLinks,
  getMedicalDocuments,
  getPatientProfiles,
  getPublicShareLinkUrl,
  revokeDocumentShareLink,
  uploadMedicalDocument
} from "../../lib/api";
import { mockDocuments } from "./mockDocuments";

const categoryOptions: Array<{ label: string; value: DocumentCategory | "all" }> = [
  { label: "All", value: "all" },
  { label: "Labs", value: "lab_report" },
  { label: "Prescriptions", value: "prescription" },
  { label: "Doctor notes", value: "doctor_note" },
  { label: "Imaging", value: "imaging" },
  { label: "Vaccines", value: "vaccination" }
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

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryLabel(category: DocumentCategory) {
  return category
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getDocumentIcon(document: MedicalDocument) {
  if (document.mimeType.startsWith("image/")) return FileImage;
  if (document.category === "lab_report") return FileArchive;

  return FileText;
}

const uploadFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(160),
  category: z.enum([
    "lab_report",
    "prescription",
    "doctor_note",
    "imaging",
    "insurance",
    "vaccination",
    "discharge_summary",
    "other"
  ]),
  description: z.string().trim().max(1000).optional(),
  tags: z.string().trim().max(240).optional(),
  file: z
    .custom<FileList>((value) => value instanceof FileList && value.length > 0, "Select a PDF or image")
    .refine((files) => files[0]?.size ? files[0].size <= 10 * 1024 * 1024 : false, "Max file size is 10 MB")
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

const shareLinkFormSchema = z.object({
  recipientEmail: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
  purpose: z.string().trim().max(500).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(30),
  maxAccessCount: z.coerce.number().int().min(1).max(100),
  allowDownload: z.boolean().optional()
});

type ShareLinkFormValues = z.infer<typeof shareLinkFormSchema>;

function UploadDocumentPanel({
  profileId,
  onUploaded
}: {
  profileId?: string;
  onUploaded: () => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError
  } = useForm<UploadFormValues>({
    defaultValues: {
      category: "lab_report",
      description: "",
      tags: "",
      title: ""
    }
  });

  const uploadMutation = useMutation({
    mutationFn: uploadMedicalDocument,
    onSuccess: () => {
      reset();
      onUploaded();
    }
  });

  function onSubmit(values: UploadFormValues) {
    const parsed = uploadFormSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && field in values) {
          setError(field as keyof UploadFormValues, {
            message: issue.message,
            type: "manual"
          });
        }
      }

      return;
    }

    if (!profileId) {
      setError("file", {
        message: "Sign in and select a patient profile before uploading.",
        type: "manual"
      });
      return;
    }

    const file = parsed.data.file[0];

    if (!file) {
      setError("file", {
        message: "Select a PDF or image",
        type: "manual"
      });
      return;
    }

    uploadMutation.mutate({
      profileId,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description || undefined,
      tags: parsed.data.tags || undefined,
      file
    });
  }

  return (
    <section className="soft-card interactive-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-950">Upload document</p>
          <p className="mt-1 text-sm text-slate-500">
            Store PDF or image files with checksum and storage metadata.
          </p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-teal-50 text-teal-800">
          <UploadCloud size={19} />
        </div>
      </div>

      {!profileId && (
        <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          Upload is disabled in demo mode until an authenticated profile is available.
        </div>
      )}

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase text-slate-500">Title</span>
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="Blood report May 2026"
            {...register("title")}
          />
          {errors.title?.message && <span className="text-xs font-semibold text-rose-600">{errors.title.message}</span>}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase text-slate-500">Category</span>
          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            {...register("category")}
          >
            <option value="lab_report">Lab report</option>
            <option value="prescription">Prescription</option>
            <option value="doctor_note">Doctor note</option>
            <option value="imaging">Imaging</option>
            <option value="insurance">Insurance</option>
            <option value="vaccination">Vaccination</option>
            <option value="discharge_summary">Discharge summary</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase text-slate-500">Description</span>
          <textarea
            className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="Short note about this document"
            {...register("description")}
          />
          {errors.description?.message && (
            <span className="text-xs font-semibold text-rose-600">{errors.description.message}</span>
          )}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase text-slate-500">Tags</span>
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="lab,bloodwork,annual"
            {...register("tags")}
          />
          {errors.tags?.message && <span className="text-xs font-semibold text-rose-600">{errors.tags.message}</span>}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase text-slate-500">File</span>
          <input
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="rounded-md border border-dashed border-slate-300 px-3 py-3 text-sm font-medium file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
            type="file"
            {...register("file")}
          />
          {errors.file?.message && <span className="text-xs font-semibold text-rose-600">{errors.file.message}</span>}
        </label>

        {uploadMutation.isError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            Upload failed. Check authentication, file type, and backend availability.
          </div>
        )}

        {uploadMutation.isSuccess && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            Document uploaded and indexed.
          </div>
        )}

        <button
          className="button-motion inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          disabled={!profileId || uploadMutation.isPending}
          type="submit"
        >
          <UploadCloud size={17} />
          {uploadMutation.isPending ? "Uploading..." : "Upload document"}
        </button>
      </form>
    </section>
  );
}

function formatShareDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getShareStatusClass(status: DocumentShareLink["status"]) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "revoked") return "bg-rose-50 text-rose-700";

  return "bg-amber-50 text-amber-700";
}

function ShareLinkPanel({
  document,
  profileId,
  onChanged
}: {
  document?: MedicalDocument;
  profileId?: string;
  onChanged: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError
  } = useForm<ShareLinkFormValues>({
    defaultValues: {
      allowDownload: false,
      expiresInDays: 7,
      maxAccessCount: 5,
      purpose: "",
      recipientEmail: ""
    }
  });

  const shareLinksQuery = useQuery({
    queryKey: ["document-share-links", profileId, document?.id],
    queryFn: () =>
      getDocumentShareLinks({
        profileId: profileId ?? "",
        documentId: document?.id ?? ""
      }),
    enabled: Boolean(profileId && document?.id),
    retry: false
  });

  const createMutation = useMutation({
    mutationFn: createDocumentShareLink,
    onSuccess: () => {
      reset();
      onChanged();
    }
  });

  const revokeMutation = useMutation({
    mutationFn: revokeDocumentShareLink,
    onSuccess: onChanged
  });

  const createdToken = createMutation.data?.shareLink.token;
  const createdUrl = createdToken ? getPublicShareLinkUrl(createdToken) : undefined;

  function onSubmit(values: ShareLinkFormValues) {
    const parsed = shareLinkFormSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && field in values) {
          setError(field as keyof ShareLinkFormValues, {
            message: issue.message,
            type: "manual"
          });
        }
      }

      return;
    }

    if (!profileId || !document) {
      setError("recipientEmail", {
        message: "Sign in and select a live document before creating a share link.",
        type: "manual"
      });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

    createMutation.mutate({
      profileId,
      documentId: document.id,
      recipientEmail: parsed.data.recipientEmail || undefined,
      purpose: parsed.data.purpose || undefined,
      allowDownload: Boolean(parsed.data.allowDownload),
      maxAccessCount: parsed.data.maxAccessCount,
      expiresAt: expiresAt.toISOString()
    });
  }

  async function copyCreatedUrl() {
    if (!createdUrl) return;

    await navigator.clipboard.writeText(createdUrl);
    setCopied(true);
  }

  const shareLinks = shareLinksQuery.data?.shareLinks ?? [];
  const disabled = !profileId || !document || document.id.startsWith("doc-demo-");

  return (
    <section className="soft-card interactive-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-950">Secure share link</p>
          <p className="mt-1 text-sm text-slate-500">
            Create time-limited document access without sharing account credentials.
          </p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-slate-800">
          <Link2 size={19} />
        </div>
      </div>

      {disabled && (
        <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          Sharing is disabled in demo mode until a live authenticated document is selected.
        </div>
      )}

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-slate-500">Expires in days</span>
            <input
              className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              min={1}
              max={30}
              type="number"
              {...register("expiresInDays")}
            />
            {errors.expiresInDays?.message && (
              <span className="text-xs font-semibold text-rose-600">{errors.expiresInDays.message}</span>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold uppercase text-slate-500">Max opens</span>
            <input
              className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              min={1}
              max={100}
              type="number"
              {...register("maxAccessCount")}
            />
            {errors.maxAccessCount?.message && (
              <span className="text-xs font-semibold text-rose-600">{errors.maxAccessCount.message}</span>
            )}
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase text-slate-500">Purpose</span>
          <textarea
            className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="For cardiology review before the appointment"
            {...register("purpose")}
          />
          {errors.purpose?.message && (
            <span className="text-xs font-semibold text-rose-600">{errors.purpose.message}</span>
          )}
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input className="h-4 w-4 rounded border-slate-300 text-teal-700" type="checkbox" {...register("allowDownload")} />
          Allow download when file streaming is enabled
        </label>

        {createMutation.isError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            Share link creation failed. Check authentication and backend availability.
          </div>
        )}

        <button
          className="button-motion inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          disabled={disabled || createMutation.isPending}
          type="submit"
        >
          <Link2 size={17} />
          {createMutation.isPending ? "Creating..." : "Create share link"}
        </button>
      </form>

      {createdUrl && (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-bold text-emerald-800">Share link created</p>
          <p className="mt-2 break-all text-xs font-semibold text-emerald-700">{createdUrl}</p>
          <button
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-bold text-white"
            onClick={() => {
              void copyCreatedUrl();
            }}
            type="button"
          >
            <Copy size={14} />
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs font-bold uppercase text-slate-500">Existing links</p>
        <div className="mt-3 grid gap-3">
          {shareLinks.map((shareLink) => (
            <article key={shareLink.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn("rounded-full px-2 py-1 text-xs font-bold", getShareStatusClass(shareLink.status))}>
                  {shareLink.status}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {shareLink.accessCount}/{shareLink.maxAccessCount} opens
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {shareLink.recipientEmail ?? "Private recipient"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Expires {formatShareDate(shareLink.expiresAt)}</p>
              {shareLink.status === "active" && (
                <button
                  className="button-motion mt-3 h-8 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                  disabled={revokeMutation.isPending}
                  onClick={() => {
                    if (!profileId || !document) return;
                    revokeMutation.mutate({
                      profileId,
                      documentId: document.id,
                      shareLinkId: shareLink.id
                    });
                  }}
                  type="button"
                >
                  Revoke
                </button>
              )}
            </article>
          ))}

          {!disabled && shareLinks.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">
              No share links have been created for this document yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function DocumentCard({
  document,
  selected,
  onSelect
}: {
  document: MedicalDocument;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = getDocumentIcon(document);

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
            {getCategoryLabel(document.category)}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {formatDate(document.uploadedAt)} - {formatBytes(document.sizeBytes)}
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-slate-950">{document.title}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
          {document.description ?? document.originalFileName}
        </p>
      </div>
    </button>
  );
}

function DocumentDetail({ document }: { document?: MedicalDocument }) {
  if (!document) {
    return (
      <aside className="soft-card border-dashed border-slate-300 p-6 text-center">
        <FileText className="mx-auto text-slate-300" size={34} />
        <p className="mt-3 text-sm font-bold text-slate-700">Select a document</p>
        <p className="mt-1 text-sm text-slate-500">
          Category, metadata, storage reference, and tags appear here.
        </p>
      </aside>
    );
  }

  return (
    <aside className="soft-card interactive-card min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-teal-700">{getCategoryLabel(document.category)}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">{document.title}</h2>
          <p className="mt-2 break-all text-sm text-slate-500">{document.originalFileName}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          indexed
        </span>
      </div>

      <dl className="mt-6 grid gap-4">
        <div className="rounded-md bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <CalendarDays size={15} />
            Uploaded
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(document.uploadedAt)}</dd>
        </div>
        <div className="rounded-md bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <Database size={15} />
            Storage
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{document.storageProvider}</dd>
          <dd className="mt-2 break-all text-xs text-slate-500">{document.storageKey}</dd>
        </div>
        <div className="rounded-md bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <ShieldCheck size={15} />
            Integrity
          </dt>
          <dd className="mt-1 break-all text-xs font-semibold text-slate-700">
            SHA-256: {document.checksumSha256}
          </dd>
        </div>
      </dl>

      {document.description && (
        <div className="mt-5 rounded-md border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{document.description}</p>
        </div>
      )}

      <div className="mt-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
          <Tags size={15} />
          Tags
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {document.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(mockDocuments[0]?.id);

  const profilesQuery = useQuery({
    queryKey: ["patient-profiles"],
    queryFn: getPatientProfiles,
    retry: false
  });

  const activeProfile = profilesQuery.data?.[0];

  const documentsQuery = useQuery({
    queryKey: ["medical-documents", activeProfile?.id, selectedCategory, search],
    queryFn: () =>
      getMedicalDocuments({
        profileId: activeProfile?.id ?? "",
        category: selectedCategory,
        q: search || undefined
      }),
    enabled: Boolean(activeProfile?.id),
    retry: false
  });

  const liveDocuments = documentsQuery.data?.documents;
  const usingDemoData = !liveDocuments;

  const documents = useMemo(() => {
    const source = liveDocuments ?? mockDocuments;
    const loweredSearch = search.trim().toLowerCase();

    return source.filter((document) => {
      const matchesCategory = selectedCategory === "all" || document.category === selectedCategory;
      const matchesSearch =
        !loweredSearch ||
        document.title.toLowerCase().includes(loweredSearch) ||
        document.description?.toLowerCase().includes(loweredSearch) ||
        document.originalFileName.toLowerCase().includes(loweredSearch) ||
        document.tags.some((tag) => tag.toLowerCase().includes(loweredSearch));

      return matchesCategory && matchesSearch;
    });
  }, [liveDocuments, search, selectedCategory]);

  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? documents[0];
  const totalStorageBytes = documents.reduce((total, document) => total + document.sizeBytes, 0);

  return (
    <div className="page-fade grid min-w-0 gap-6">
      <section className="soft-card interactive-card p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-bold text-teal-700">Document Vault</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Medical documents, organized securely</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review lab reports, prescriptions, doctor notes, vaccination records, and storage metadata in one
              profile-scoped library.
            </p>
          </div>
          <div className="grid gap-3 rounded-md bg-slate-50 px-4 py-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Data source</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {usingDemoData ? "Demo documents" : activeProfile?.fullName ?? "Live profile"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Storage indexed</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatBytes(totalStorageBytes)}</p>
            </div>
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
              placeholder="Search documents by title, file name, note, or tag"
              value={search}
            />
          </label>

          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "button-motion h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition",
                  selectedCategory === option.value
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                onClick={() => {
                  setSelectedCategory(option.value);
                  setSelectedDocumentId(undefined);
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
            <FileText size={18} />
            {documents.length} document{documents.length === 1 ? "" : "s"}
          </div>

          {documents.map((document) => (
            <DocumentCard
              document={document}
              key={document.id}
              onSelect={() => setSelectedDocumentId(document.id)}
              selected={selectedDocument?.id === document.id}
            />
          ))}

          {documents.length === 0 && (
            <div className="soft-card border-dashed border-slate-300 p-8 text-center">
              <FileText className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-sm font-bold text-slate-700">No documents found</p>
              <p className="mt-1 text-sm text-slate-500">Try another category or search term.</p>
            </div>
          )}
        </div>

        <div className="page-fade grid min-w-0 gap-6">
          <UploadDocumentPanel
            onUploaded={() => {
              void queryClient.invalidateQueries({ queryKey: ["medical-documents"] });
            }}
            profileId={activeProfile?.id}
          />
          <DocumentDetail document={selectedDocument} />
          <ShareLinkPanel
            document={selectedDocument}
            onChanged={() => {
              void queryClient.invalidateQueries({ queryKey: ["document-share-links"] });
            }}
            profileId={activeProfile?.id}
          />
        </div>
      </section>
    </div>
  );
}
