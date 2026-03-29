"use client";

import { useEffect, useState, useRef } from "react";
import { UploadIcon, XIcon, ImageIcon } from "lucide-react";

export default function AdminGallery() {
  const [gallery, setGallery] = useState([]);
  const [name, setName] = useState("");
  const [existingImgUrl, setExistingImgUrl] = useState(""); // already on Cloudinary
  const [newFile, setNewFile] = useState(null);             // raw File object
  const [imagePreview, setImagePreview] = useState("");     // blob URL for preview
  const [link, setLink] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  /* ── Fetch All ── */
  const loadGallery = async () => {
    const res = await fetch("/api/gallery");
    const data = await res.json();
    setGallery(data);
  };

  useEffect(() => {
    loadGallery();
  }, []);

  /* ── Process picked file ── */
  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }
    setNewFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExistingImgUrl("");
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e) => {
    processFile(e.target.files?.[0]);
  };

  const clearImage = () => {
    setNewFile(null);
    setExistingImgUrl("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Read File → base64 data URI ── */
  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = (e) => resolve(e.target.result); // "data:image/jpeg;base64,..."
      reader.readAsDataURL(file);
    });
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) { alert("Trip Name is required"); return; }
    if (!newFile && !existingImgUrl) { alert("Please upload an image"); return; }

    setLoading(true);
    try {
      if (editId) {
        /* ── UPDATE ── */
        const body = { id: editId, name: name.trim(), link, img: existingImgUrl };

        if (newFile) {
          // New file picked — send base64 so route can re-upload to Cloudinary
          body.imageData = await readFileAsDataUrl(newFile);
          delete body.img; // route will set img from Cloudinary result
        }

        const res = await fetch("/api/gallery", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Update failed");

      } else {
        /* ── CREATE ── */
        const imageData = await readFileAsDataUrl(newFile);

        const res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), imageData, link }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Create failed");
      }

      resetForm();
      loadGallery();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!confirm("Delete this image?")) return;
    await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
    loadGallery();
  };

  /* ── Edit ── */
  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setLink(item.link || "");
    setExistingImgUrl(item.img);
    setNewFile(null);
    setImagePreview(item.img);
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setLink("");
    clearImage();
  };

  return (
    <div className="p-10 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Gallery Manager</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-10">

        <input
          placeholder="Trip Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {/* Image Upload Zone */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <ImageIcon className="size-4" /> Trip Image
          </label>

          {imagePreview ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-gray-100">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {newFile ? (
                <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                  New
                </span>
              ) : (
                <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                  Current
                </span>
              )}
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
              >
                <XIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded"
              >
                Replace
              </button>
            </div>
          ) : (
            <div
              className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                isDraggingOver
                  ? "border-black bg-gray-50"
                  : "border-gray-300 hover:border-gray-500"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="mb-2 size-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-500">Drop image here</p>
              <p className="text-xs text-gray-400">or click to browse</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <input
          placeholder="Redirect Link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Saving..." : editId ? "Update" : "Save"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="space-y-4">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="border p-3 rounded flex justify-between items-center gap-4"
          >
            <img
              src={item.img}
              alt={item.name}
              className="w-16 h-16 object-cover rounded flex-none"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-400 truncate">{item.img}</p>
            </div>
            <div className="flex gap-2 flex-none">
              <button
                onClick={() => handleEdit(item)}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}