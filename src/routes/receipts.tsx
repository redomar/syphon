import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { Upload, FileText, Trash2, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

export default function ReceiptsPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const receipts = useQuery(api.receipts.getReceipts);
  const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);
  const saveReceipt = useMutation(api.receipts.saveReceipt);
  const deleteReceipt = useMutation(api.receipts.deleteReceipt);

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only JPG, PNG, or PDF files are supported");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      await saveReceipt({
        storageId,
        name: file.name,
        contentType: file.type,
        size: file.size,
      });
      toast.success("Receipt uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleDelete = async (receiptId: Id<"receipts">) => {
    try {
      await deleteReceipt({ receiptId });
      toast.success("Receipt deleted");
    } catch {
      toast.error("Failed to delete receipt");
    }
  };

  const isLoading = receipts === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Receipts
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Keep proof of purchase
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload receipts (JPG, PNG, PDF up to 5MB) for returns and taxes.
            </p>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
          >
            {uploading ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload Receipt
          </Button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center border border-border bg-card rounded-lg">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No receipts yet</p>
            <p className="text-muted-foreground text-sm">
              Upload your first receipt to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {receipts.map((r) => (
              <div
                key={r._id}
                className="rounded-lg border border-border bg-card overflow-hidden group"
              >
                <a
                  href={r.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square bg-muted flex items-center justify-center overflow-hidden"
                >
                  {r.contentType.startsWith("image/") && r.url ? (
                    <img
                      src={r.url}
                      alt={r.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  )}
                </a>
                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="text-xs text-foreground truncate" title={r.name}>
                    {r.name}
                  </span>
                  <div className="flex shrink-0">
                    <a
                      href={r.url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-muted-foreground hover:text-foreground"
                      aria-label="View receipt"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-1 text-muted-foreground hover:text-red-400"
                      aria-label="Delete receipt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
