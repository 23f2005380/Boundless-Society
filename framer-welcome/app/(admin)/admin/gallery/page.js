"use client";

import { useEffect, useState } from "react";

export default function AdminGallery() {

  const [gallery, setGallery] = useState([]);

  const [name, setName] = useState("");
  const [img, setImg] = useState("");
  const [link, setLink] = useState("");

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);


  /* Fetch All*/
  const loadGallery = async () => {
    const res = await fetch("/api/gallery");
    const data = await res.json();
    setGallery(data);
  };

  useEffect(() => {
    loadGallery();
  }, []);


  /* Submit (Create/Update) */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !img) {
      alert("Name & Image required");
      return;
    }

    setLoading(true);

    try {

      if (editId) {
        /* Update */
        await fetch("/api/gallery", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editId,
            name,
            img,
            link,
          }),
        });

      } else {
        /* Create */
        await fetch("/api/gallery", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            img,
            link,
          }),
        });
      }

      resetForm();
      loadGallery();

    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };


  /* Delete */
  const handleDelete = async (id) => {

    if (!confirm("Delete this image?")) return;

    await fetch(`/api/gallery?id=${id}`, {
      method: "DELETE",
    });

    loadGallery();
  };


  /* Edit */
  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setImg(item.img);
    setLink(item.link || "");
  };


  const resetForm = () => {
    setEditId(null);
    setName("");
    setImg("");
    setLink("");
  };


  return (
    <div className="p-10 max-w-4xl">

      <h1 className="text-2xl font-bold mb-6">
        Gallery Manager
      </h1>


      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-10">

        <input
          placeholder="Trip Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Image URL"
          value={img}
          onChange={(e) => setImg(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Redirect Link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <div className="flex gap-2">

          <button
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {editId ? "Update" : "Save"}
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
            className="border p-3 rounded flex justify-between items-center"
          >

            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500 truncate w-96">
                {item.img}
              </p>
            </div>

            <div className="flex gap-2">

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
