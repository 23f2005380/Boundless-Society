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
  SelectValue,
} from "@/components/ui/select";

export default function EditCityMeetupPage({ params }) {
  const router = useRouter();
  
  // Unwrap the params promise using React.use()
  const resolvedParams = React.use(params);
  const id = resolvedParams.id; 
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [file, setFile] = useState(null);
  
  const [sections, setSections] = useState([]);
  const [subSections, setSubSections] = useState([]);

  const [formData, setFormData] = useState({
    mainSection: "",
    subSection: "",
    cityName: "",
    color: "#FEFAE7", // Default fallback color
    img: "", 
  });

  useEffect(() => {
    // Prevent fetching if ID is missing or undefined
    if (!id || id === "undefined") return;

    const fetchData = async () => {
      try {
        const [secRes, subSecRes, meetupRes] = await Promise.all([
          fetch("/api/meetup-sections"),
          fetch("/api/meetup-sub-sections"),
          fetch(`/api/city-meetups/${id}`) 
        ]);
        
        const secData = await secRes.json();
        const subSecData = await subSecRes.json();
        const meetupData = await meetupRes.json();
        
        if (secRes.ok) setSections(secData.sections || []);
        if (subSecRes.ok) setSubSections(subSecData.subSections || []);
        
        if (meetupRes.ok) {
          setFormData({
            mainSection: meetupData.meetup.mainSection || "",
            subSection: meetupData.meetup.subSection || "",
            cityName: meetupData.meetup.cityName || "",
            color: meetupData.meetup.color || "#FEFAE7", // FETCH EXISTING COLOR
            img: meetupData.meetup.img || "",
          });
        } else {
          toast.error("Meetup not found");
        }
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id]);

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.img;

      if (file) {
        const base64Image = await convertFileToBase64(file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [base64Image], folder: "city_meetups" }),
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
        imageUrl = uploadData.links?.[0]; 
      }

      const apiRes = await fetch(`/api/city-meetups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainSection: formData.mainSection,
          subSection: formData.subSection,
          cityName: formData.cityName,
          color: formData.color, // SEND UPDATED COLOR TO DATABASE
          img: imageUrl,
        }),
      });

      if (!apiRes.ok) throw new Error("Failed to update meetup");

      toast.success("City Meetup updated successfully!");
      router.push("/admin/city-meetups");

    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10">Loading meetup data...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Edit City Meetup</h1>
      
      <form onSubmit={handleUpdate} className="space-y-6">
        
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

        <div className="space-y-2">
          <Label htmlFor="cityName">City Name</Label>
          <Input
            id="cityName"
            required
            value={formData.cityName}
            onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
          />
        </div>

        {/* --- COLOR PICKER ADDED HERE --- */}
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
        {/* ------------------------------- */}

        {formData.img && (
          <div className="space-y-2">
            <Label>Current Image</Label>
            <img src={formData.img} alt="Current" className="h-32 rounded-md object-cover" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="image">Replace Image (Optional)</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer file:text-foreground"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Updating..." : "Update City Meetup"}
        </Button>
      </form>
    </div>
  );
}