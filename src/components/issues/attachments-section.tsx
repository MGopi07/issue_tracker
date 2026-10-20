"use client";

import { useState, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { uploadAttachmentAction, deleteAttachmentAction } from "@/actions/attachments";
import {
  Paperclip,
  UploadCloud,
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  Download,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string | Date;
  uploadedById: string;
}

interface AttachmentsSectionProps {
  issueId: string;
  attachments: AttachmentItem[];
  currentUserId?: string;
  userRole?: string;
}

function SubmitUploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
    >
      {pending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Uploading...</span>
        </>
      ) : (
        <>
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload File</span>
        </>
      )}
    </button>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string, name: string) {
  if (mime.startsWith("image/")) return <FileImage className="w-4 h-4 text-purple-600" />;
  if (mime === "application/pdf" || mime.includes("text"))
    return <FileText className="w-4 h-4 text-sky-600" />;
  if (name.endsWith(".zip") || mime.includes("zip"))
    return <FileArchive className="w-4 h-4 text-amber-600" />;
  if (name.endsWith(".json") || name.endsWith(".har") || name.endsWith(".sql"))
    return <FileCode className="w-4 h-4 text-emerald-600" />;
  return <Paperclip className="w-4 h-4 text-slate-500" />;
}

export function AttachmentsSection({
  issueId,
  attachments,
  currentUserId,
  userRole,
}: AttachmentsSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, formAction] = useFormState(uploadAttachmentAction, null);

  if (uploadState?.success && isUploading) {
    setIsUploading(false);
    setSelectedFile(null);
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete attachment "${name}"?`)) {
      await deleteAttachmentAction(id);
    }
  };

  const canDelete = (item: AttachmentItem) =>
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "PROJECT_MANAGER" ||
    item.uploadedById === currentUserId;

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Diagnostic Attachments & Logs ({attachments.length})
          </h2>
        </div>

        {!isUploading && (
          <button
            onClick={() => setIsUploading(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Attach File</span>
          </button>
        )}
      </div>

      {/* Upload Box */}
      {isUploading && (
        <form
          action={formAction}
          className="p-5 rounded-2xl bg-indigo-50/20 border border-indigo-100 space-y-3"
        >
          <input type="hidden" name="issueId" value={issueId} />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Upload Diagnostic File or Screenshot
            </span>
            <button
              type="button"
              onClick={() => {
                setIsUploading(false);
                setSelectedFile(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {uploadState?.error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {uploadState.error}
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 border-2 border-dashed border-indigo-200 rounded-xl bg-white hover:bg-indigo-50/40 transition-colors text-center cursor-pointer space-y-2"
          >
            <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto" />
            <div className="text-xs text-slate-700 font-medium">
              {selectedFile ? (
                <span className="font-bold text-indigo-600">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </span>
              ) : (
                <>
                  <span className="font-semibold text-indigo-600">
                    Click to select file
                  </span>{" "}
                  or drag and drop here
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Supported: PNG, JPG, WebP, PDF, logs, text, JSON, HAR, SQL, ZIP (max 25MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            name="file"
            required
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsUploading(false);
                setSelectedFile(null);
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <SubmitUploadButton />
          </div>
        </form>
      )}

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
          No diagnostic files or screenshots attached yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:bg-white hover:shadow-2xs transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">
                  {getFileIcon(item.mimeType, item.fileName)}
                </div>
                <div className="min-w-0">
                  <a
                    href={`/api/attachments/${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-slate-800 hover:text-indigo-600 truncate block text-xs"
                    title={item.fileName}
                  >
                    {item.fileName}
                  </a>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {formatFileSize(item.fileSize)} •{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`/api/attachments/${item.id}`}
                  download={item.fileName}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                {canDelete(item) && (
                  <button
                    onClick={() => handleDelete(item.id, item.fileName)}
                    className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
