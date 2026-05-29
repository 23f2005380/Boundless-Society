export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadBase64Files(
  base64List,
  { folder = "previous_trips", resourceType = "image" } = {}
) {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: base64List, folder, resourceType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.links || [];
}
