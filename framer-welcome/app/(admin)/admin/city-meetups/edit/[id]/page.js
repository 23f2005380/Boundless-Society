"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2Icon } from "lucide-react";

export default function EditCityMeetupPage({ params }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id; 
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [sections, setSections] = useState([]);
  const [subSections, setSubSections] = useState([]);
  const [formData, setFormData] = useState({ 
    mainSection: "", 
    subSection: "", 
    cityName: "", 
    color: "#FEFAE7", 
    img: "" 
  });
  
  const [newImage, setNewImage] = useState({ file: null, preview: null, base64: null });

  useEffect(() => {
    if (!id || id === "undefined") return;
    const fetchData = async () => {
      try {
        const [secRes, meetupRes] = await Promise.all([
          fetch("/api/city-meetups/meetup-sections"),
          fetch(`/api/city-meetups?id=${id}`),
        ]);

        const secData = await secRes.json();
        const meetupData = await meetupRes.json();

        if (secRes.ok) setSections(secData.sections || []);

        if (meetupRes.ok && meetupData.meetup) {
          const mainName = meetupData.meetup.mainSection || "";
          setFormData({
            mainSection: mainName,
            subSection: meetupData.meetup.subSection || "",
            cityName: meetupData.meetup.cityName || "",
            color: meetupData.meetup.color || "#FEFAE7",
            img: meetupData.meetup.img || "",
          });

          // Find section id for the meetup's main section name and load sub-sections for it
          const matched = (secData.sections || []).find((s) => s.name === mainName);
          if (matched) {
            try {
              const subRes = await fetch(`/api/city-meetups/meetup-sub-sections?sectionId=${matched.id}`);
              const subData = await subRes.json();
              if (subRes.ok) setSubSections(subData.subSections || []);
            } catch (err) {
              console.warn("Failed to load sub-sections for section", matched.id);
            }
          }
        }
      } catch (error) { toast.error("Failed to load data"); } 
      finally { setFetching(false); }
    };
    fetchData();
  }, [id]);

  // When user changes the selected main section, fetch sub-sections for it
  useEffect(() => {
    const loadForSelected = async () => {
      if (!formData.mainSection || sections.length === 0) return;
      const matched = sections.find((s) => s.name === formData.mainSection);
      if (!matched) {
        setSubSections([]);
        setFormData((f) => ({ ...f, subSection: "" }));
        return;
      }

      try {
        const res = await fetch(`/api/city-meetups/meetup-sub-sections?sectionId=${matched.id}`);
        const data = await res.json();
        if (res.ok) {
          setSubSections(data.subSections || []);
          // If the current subSection name is not in the new list, clear it
          if (!data.subSections?.some((ss) => ss.name === formData.subSection)) {
            setFormData((f) => ({ ...f, subSection: "" }));
          }
        }
      } catch (err) {
        console.warn("Failed to load sub-sections for selected section", matched.id);
      }
    };

    loadForSelected();
  }, [formData.mainSection, sections]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage({ file, preview: reader.result, base64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.img;

      if (newImage.base64) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [newImage.base64], folder: "city_meetups" }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
        imageUrl = uploadData.links?.[0];
      }

      const apiRes = await fetch(`/api/city-meetups`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...formData, img: imageUrl }),
      });

      if (!apiRes.ok) throw new Error("Failed to update meetup");
      toast.success("City Meetup updated successfully!");
      router.push("/admin/city-meetups");

    } catch (error) { toast.error(error.message); } 
    finally { setLoading(false); }
  };

  if (fetching) return <div className="p-10 text-center">Loading meetup data...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Edit City Meetup</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        
        {/* Main Section */}
        <div className="space-y-2">
          <Label>Main Section</Label>
          <Select 
            value={formData.mainSection} 
            onValueChange={(val) => setFormData({ ...formData, mainSection: val })}
          >
            <SelectTrigger><SelectValue placeholder="Select a main section" /></SelectTrigger>
            <SelectContent>
              {sections.map((sec) => (
                <SelectItem key={sec.id} value={sec.name}>{sec.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub Section */}
        <div className="space-y-2">
          <Label>Sub Section</Label>
          <Select 
            value={formData.subSection} 
            onValueChange={(val) => setFormData({ ...formData, subSection: val })}
          >
            <SelectTrigger><SelectValue placeholder="Select a sub section" /></SelectTrigger>
            <SelectContent>
              {subSections.map((sec) => (
                <SelectItem key={sec.id} value={sec.name}>{sec.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Name */}
        <div className="space-y-2">
          <Label htmlFor="cityName">City Name</Label>
          <Input
            id="cityName"
            required
            value={formData.cityName}
            onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <Label htmlFor="color">Card Color</Label>
          <div className="flex items-center gap-4">
            <input
              id="color"
              type="color"
              className="w-14 h-14 p-1 rounded cursor-pointer border-0"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
            <span className="text-sm text-muted-foreground uppercase">{formData.color}</span>
          </div>
        </div>

        {/* Image Preview & Upload */}
        <div className="space-y-2">
          <Label>Meetup Image</Label>
          <div className="flex flex-col gap-2">
            <img 
              src={newImage.preview || formData.img} 
              alt="Preview" 
              className="h-48 w-full object-cover rounded-md border shadow-sm" 
            />
            <p className="text-xs text-muted-foreground">
              {newImage.preview ? "New image selected" : "Current image"}
            </p>
          </div>
          <Label htmlFor="image" className="mt-4 block">Replace Image (Optional)</Label>
          <Input 
            id="image" 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="cursor-pointer" 
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
          {loading ? "Updating..." : "Update City Meetup"}
        </Button>
      </form>
    </div>
  );
}