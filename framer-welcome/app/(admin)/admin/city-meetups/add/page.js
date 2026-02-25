"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrashIcon, PlusIcon, XIcon, CheckIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddCityMeetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  
  // -- MAIN SECTION STATE --
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionPriority, setNewSectionPriority] = useState("");

  // -- SUB SECTION STATE --
  const [subSections, setSubSections] = useState([]);
  const [selectedSubSectionId, setSelectedSubSectionId] = useState("");
  const [isAddingSubSection, setIsAddingSubSection] = useState(false);
  const [newSubSectionName, setNewSubSectionName] = useState("");
  const [newSubSectionPriority, setNewSubSectionPriority] = useState("");

  // -- NEW: FORM DATA STATE (Includes City Name) --
  const [formData, setFormData] = useState({
    cityName: "",
    color: "#FFD700",
  });

  // 1. Fetch data on load
  const fetchData = async () => {
    try {
      const [secRes, subSecRes] = await Promise.all([
        fetch("/api/meetup-sections"),
        fetch("/api/meetup-sub-sections")
      ]);
      
      const secData = await secRes.json();
      const subSecData = await subSecRes.json();
      
      if (secRes.ok) setSections(secData.sections || []);
      if (subSecRes.ok) setSubSections(subSecData.subSections || []);
    } catch (error) {
      toast.error("Failed to load sections data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Handlers for Main Section
  const handleAddSection = async () => {
    if (!newSectionName.trim()) return toast.error("Section name cannot be empty");
    try {
      const res = await fetch("/api/meetup-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSectionName, priority: newSectionPriority }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Main Section added!");
        setNewSectionName(""); setNewSectionPriority(""); setIsAddingSection(false);
        await fetchData();
        setSelectedSectionId(data.id);
      } else throw new Error(data.error);
    } catch (error) { toast.error("Failed to create section"); }
  };

  const handleDeleteSection = async () => {
    if (!selectedSectionId || !confirm("Delete this main section?")) return;
    try {
      const res = await fetch(`/api/meetup-sections/${selectedSectionId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Main Section removed");
        setSelectedSectionId("");
        fetchData();
      } else throw new Error("Failed to delete");
    } catch (error) { toast.error(error.message); }
  };

  // 3. Handlers for Sub Section
  const handleAddSubSection = async () => {
    if (!newSubSectionName.trim()) return toast.error("Sub-section name cannot be empty");
    try {
      const res = await fetch("/api/meetup-sub-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubSectionName, priority: newSubSectionPriority }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Sub Section added!");
        setNewSubSectionName(""); setNewSubSectionPriority(""); setIsAddingSubSection(false);
        await fetchData();
        setSelectedSubSectionId(data.id);
      } else throw new Error(data.error);
    } catch (error) { toast.error("Failed to create sub-section"); }
  };

  const handleDeleteSubSection = async () => {
    if (!selectedSubSectionId || !confirm("Delete this sub-section?")) return;
    try {
      const res = await fetch(`/api/meetup-sub-sections/${selectedSubSectionId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Sub Section removed");
        setSelectedSubSectionId("");
        fetchData();
      } else throw new Error("Failed to delete");
    } catch (error) { toast.error(error.message); }
  };

  // 4. File Converter
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // 5. Final Form Submission
  const handleUploadAndSave = async (e) => {
    e.preventDefault();

    const selectedSection = sections.find((s) => s.id === selectedSectionId);
    const selectedSubSection = subSections.find((s) => s.id === selectedSubSectionId);

    if (!selectedSection || !selectedSubSection) {
      toast.error("Please select or create both a Main Section and a Sub Section.");
      return;
    }

    if (!file) {
      toast.error("Please select an image first.");
      return;
    }

    setLoading(true);

    try {
      const base64Image = await convertFileToBase64(file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [base64Image], folder: "city_meetups" }),
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");

      const imageUrl = uploadData.links?.[0]; 
      if (!imageUrl) throw new Error("No image URL returned");

      // Save meetup with string names of the selected sections AND City Name
      const apiRes = await fetch("/api/city-meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainSection: selectedSection.name, 
          subSection: selectedSubSection.name,
          cityName: formData.cityName,
          color: formData.color,
          img: imageUrl,
        }),
      });

      if (!apiRes.ok) throw new Error("Failed to save meetup to database");

      toast.success("City Meetup added successfully!");
      router.push("/admin/city-meetups");

    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Add City Meetup Photo</h1>
      
      <form onSubmit={handleUploadAndSave} className="space-y-6">
        
        {/* MAIN SECTION SELECTOR */}
        <div className="space-y-2 p-4 border rounded-md bg-muted/30">
          <Label>Main Section</Label>
          {isAddingSection ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Name (e.g. Tri-Colour Trails)"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                autoFocus
              />
              <Input
                type="number"
                placeholder="Priority (e.g. 1)"
                className="w-24"
                value={newSectionPriority}
                onChange={(e) => setNewSectionPriority(e.target.value)}
              />
              <Button type="button" onClick={handleAddSection} size="icon" variant="default">
                <CheckIcon className="h-4 w-4" />
              </Button>
              <Button type="button" onClick={() => setIsAddingSection(false)} size="icon" variant="ghost">
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                  <SelectTrigger><SelectValue placeholder="Select a main section" /></SelectTrigger>
                  <SelectContent>
                    {sections.length === 0 && <div className="p-2 text-sm text-muted-foreground text-center">No sections found</div>}
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id}>
                        {sec.name} <span className="text-xs text-muted-foreground ml-2">(Priority: {sec.priority})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setIsAddingSection(true)} title="Add New">
                <PlusIcon className="h-4 w-4" />
              </Button>
              {selectedSectionId && (
                <Button type="button" variant="destructive" size="icon" onClick={handleDeleteSection} title="Delete">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* SUB SECTION SELECTOR */}
        <div className="space-y-2 p-4 border rounded-md bg-muted/30">
          <Label>Sub Section (Used as Heading)</Label>
          {isAddingSubSection ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Name (e.g. Tri-Colour Trails 2.0)"
                value={newSubSectionName}
                onChange={(e) => setNewSubSectionName(e.target.value)}
                autoFocus
              />
              <Input
                type="number"
                placeholder="Priority (e.g. 1)"
                className="w-24"
                value={newSubSectionPriority}
                onChange={(e) => setNewSubSectionPriority(e.target.value)}
              />
              <Button type="button" onClick={handleAddSubSection} size="icon" variant="default">
                <CheckIcon className="h-4 w-4" />
              </Button>
              <Button type="button" onClick={() => setIsAddingSubSection(false)} size="icon" variant="ghost">
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={selectedSubSectionId} onValueChange={setSelectedSubSectionId}>
                  <SelectTrigger><SelectValue placeholder="Select a sub section" /></SelectTrigger>
                  <SelectContent>
                    {subSections.length === 0 && <div className="p-2 text-sm text-muted-foreground text-center">No sub-sections found</div>}
                    {subSections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id}>
                        {sec.name} <span className="text-xs text-muted-foreground ml-2">(Priority: {sec.priority})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setIsAddingSubSection(true)} title="Add New">
                <PlusIcon className="h-4 w-4" />
              </Button>
              {selectedSubSectionId && (
                <Button type="button" variant="destructive" size="icon" onClick={handleDeleteSubSection} title="Delete">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* NEW CITY NAME FIELD */}
        <div className="space-y-2">
          <Label htmlFor="cityName">City Name</Label>
          <Input
            id="cityName"
            placeholder="e.g. Mumbai, Delhi, Bangalore"
            required
            value={formData.cityName}
            onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
          />
        </div>

        {/* IMAGE FIELD */}
        <div className="space-y-2">
          <Label htmlFor="image">Meetup Image</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer file:text-foreground"
          />
        </div>

        {/* COLOR PICKER */}
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Uploading & Saving..." : "Add City Meetup"}
        </Button>
      </form>
    </div>
  );
}