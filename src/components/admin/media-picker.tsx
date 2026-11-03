"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, ImageOff, ImagePlus, Loader2, Search, X } from "lucide-react";
import { pickerMedia, type PickerItem, type PickerPage } from "@/app/admin/(panel)/media/picker-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  id: string;
  value: number | null;
  onChange: (id: number | null, item: PickerItem | null) => void;
  /** Initial preview so the form does not need a round-trip on load. */
  initial?: PickerItem | null;
}

function thumb(item: PickerItem): string {
  return item.mimeType === "image/svg+xml" ? mediaUrl(item.key) : `${mediaUrl(item.key)}?w=320&q=70`;
}

export function MediaPicker({ id, value, onChange, initial }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PickerItem | null>(initial ?? null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PickerPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        try {
          setError(null);
          setData(await pickerMedia(search, page));
        } catch {
          setError("Could not load the media library.");
        }
      });
    }, 250);
    return () => clearTimeout(t);
  }, [open, search, page]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex size-20 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {selected ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail served by the media route
          <img src={thumb(selected)} alt={selected.alt || selected.filename} className="size-full object-contain" />
        ) : (
          <ImageOff className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="max-w-56 truncate text-sm text-muted-foreground">{selected ? selected.filename : "No image selected"}</p>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button id={id} type="button" variant="outline" className="h-9">
                <ImagePlus aria-hidden /> {selected ? "Change" : "Choose image"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Choose an image</DialogTitle>
                <DialogDescription>Upload new files in the Media library first.</DialogDescription>
              </DialogHeader>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  aria-label="Search images"
                  placeholder="Search by file name or alt text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-10 pl-9"
                />
              </div>
              {error ? (
                <p role="alert" className="py-8 text-center text-sm text-destructive">{error}</p>
              ) : !data ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
              ) : data.items.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No images match “{search}”.</p>
              ) : (
                <ul className={cn("grid grid-cols-3 gap-2 sm:grid-cols-6", pending && "opacity-60")}>
                  {data.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => { setSelected(item); onChange(item.id, item); setOpen(false); }}
                        className={cn("flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border bg-muted p-1 hover:ring-2 hover:ring-primary", value === item.id && "ring-2 ring-primary")}
                        title={item.filename}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                        <img src={thumb(item)} alt={item.alt || item.filename} loading="lazy" className="max-h-full max-w-full object-contain" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{data.total} images · Page {data.page} of {data.totalPages}</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="icon" aria-label="Previous page" disabled={page <= 1 || pending} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                    <Button type="button" variant="outline" size="icon" aria-label="Next page" disabled={page >= data.totalPages || pending} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
                  </div>
                </div>
              )}
              {pending && <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" aria-label="Loading" />}
            </DialogContent>
          </Dialog>
          {selected && (
            <Button type="button" variant="ghost" className="h-9" onClick={() => { setSelected(null); onChange(null, null); }}>
              <X aria-hidden /> Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
