"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadMedia } from "../actions";

interface Item {
  id: string;
  name: string;
  size: number;
  state: "queued" | "uploading" | "done" | "error";
  message?: string;
}

const MAX = 10 * 1024 * 1024;

export function Uploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const patch = (id: string, next: Partial<Item>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));

  async function handle(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 20);
    if (!list.length) return;
    const queued = list.map((f) => ({ file: f, item: { id: crypto.randomUUID(), name: f.name, size: f.size, state: "queued" as const } }));
    setItems((prev) => [...queued.map((q) => q.item), ...prev]);
    setBusy(true);
    let okCount = 0;
    // Sequential: each request stays under the action body limit and reports its own status.
    for (const { file, item } of queued) {
      if (file.size > MAX) {
        patch(item.id, { state: "error", message: "Larger than 10 MB." });
        continue;
      }
      patch(item.id, { state: "uploading" });
      try {
        const fd = new FormData();
        fd.append("files", file);
        const [res] = await uploadMedia(fd);
        patch(item.id, { state: res.ok ? "done" : "error", message: res.message });
        if (res.ok) okCount++;
      } catch {
        patch(item.id, { state: "error", message: "Upload failed. Please try again." });
      }
    }
    setBusy(false);
    if (okCount) {
      toast.success(`${okCount} file${okCount === 1 ? "" : "s"} uploaded.`);
      router.refresh();
    }
    if (input.current) input.current.value = "";
  }

  return (
    <section aria-labelledby="upload-title" className="mb-6 rounded-xl border bg-card p-4 sm:p-6">
      <h2 id="upload-title" className="sr-only">Upload files</h2>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void handle(e.dataTransfer.files); }}
        className={cn("flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors", drag ? "border-primary bg-primary/5" : "border-border")}
      >
        <Upload className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm">
          Drag files here, or{" "}
          <label htmlFor="media-files" className="cursor-pointer font-semibold text-primary underline-offset-4 hover:underline">browse</label>
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, GIF, AVIF, SVG or PDF · up to 10 MB each · max 20 at a time</p>
        <input
          ref={input}
          id="media-files"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,application/pdf"
          className="sr-only"
          disabled={busy}
          onChange={(e) => e.target.files && void handle(e.target.files)}
        />
      </div>
      {items.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Uploads</p>
            {!busy && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setItems([])}>
                <X aria-hidden /> Clear list
              </Button>
            )}
          </div>
          <ul className="divide-y rounded-lg border" aria-live="polite">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                {i.state === "done" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                ) : i.state === "error" ? (
                  <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
                ) : (
                  <Loader2 className={cn("size-4 shrink-0 text-muted-foreground", i.state === "uploading" && "animate-spin")} aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate">{i.name}</span>
                <span className={cn("shrink-0 text-xs", i.state === "error" ? "text-destructive" : "text-muted-foreground")}>
                  {i.state === "queued" ? "Waiting" : i.state === "uploading" ? "Uploading…" : i.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
