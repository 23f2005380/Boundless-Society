"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2Icon, X } from "lucide-react";
import { toast } from "sonner";
import { readFileAsDataUrl, uploadBase64Files } from "@/lib/upload-media";

function fileNameFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || "Video");
  } catch {
    return "Video";
  }
}

export default function MediaFileUpload({
  label,
  urls,
  onChange,
  accept,
  resourceType = "image",
  inputId,
  folder = "previous_trips",
}) {
  const [uploading, setUploading] = useState(false);
  const isVideo = resourceType === "video";

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    try {
      const base64List = await Promise.all(files.map(readFileAsDataUrl));
      const links = await uploadBase64Files(base64List, { folder, resourceType });
      if (!links.length) throw new Error("Upload failed");
      onChange([...urls, ...links]);
      toast.success(
        `Uploaded ${links.length} ${links.length === 1 ? "file" : "files"}`
      );
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>

      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              {isVideo ? (
                <div className="flex h-full w-full flex-col">
                  <video
                    src={url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full flex-1 object-cover"
                  />
                  <p className="truncate px-1 py-0.5 text-[10px] text-muted-foreground bg-background/90">
                    {fileNameFromUrl(url)}
                  </p>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 rounded-full shadow-sm"
                onClick={() => removeAt(index)}
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Input
        id={inputId}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="cursor-pointer"
      />
      {uploading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Uploading…
        </p>
      )}
    </div>
  );
}
