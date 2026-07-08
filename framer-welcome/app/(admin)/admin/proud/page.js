"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";

export default function ManageProudPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("stats"); // 'stats' or 'marquee'
  const [stats, setStats] = useState([]);
  const [marquee, setMarquee] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch("/api/proud-stats");
      const statsData = await statsRes.json();
      
      const marqueeRes = await fetch("/api/proud-marquee");
      const marqueeData = await marqueeRes.json();
      
      if (statsRes.ok && marqueeRes.ok) {
        setStats(statsData.stats || []);
        setMarquee(marqueeData.marquee || []);
      } else {
        throw new Error("Failed to load section data");
      }
    } catch (error) {
      toast.error(error.message || "Failed to load proud section data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Stats Delete
  const handleDeleteStat = async (id) => {
    if (!confirm("Are you sure you want to delete this statistic?")) return;
    try {
      const res = await fetch(`/api/proud-stats?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Statistic deleted successfully");
        setStats((prev) => prev.filter((s) => s.id !== id));
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle Marquee Delete
  const handleDeleteMarquee = async (id) => {
    if (!confirm("Are you sure you want to delete this marquee item?")) return;
    try {
      const res = await fetch(`/api/proud-marquee?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Marquee item deleted successfully");
        setMarquee((prev) => prev.filter((m) => m.id !== id));
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-10">Loading section data...</div>;

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm m-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage &quot;We Proud to Have&quot; Section</h1>
        <div className="flex gap-2">
          {activeTab === "stats" ? (
            <Button onClick={() => router.push("/admin/proud/stats/add")}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add New Stat
            </Button>
          ) : (
            <Button onClick={() => router.push("/admin/proud/marquee/add")}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Marquee Item
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-4 border-b border-border pb-4 mb-6">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === "stats"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Statistics Cards
        </button>
        <button
          onClick={() => setActiveTab("marquee")}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === "marquee"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Curved Marquee Items
        </button>
      </div>

      {/* Stats Tab Content */}
      {activeTab === "stats" && (
        <div>
          {stats.length === 0 ? (
            <p className="text-muted-foreground">No statistics cards found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Number Value</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">{stat.label}</TableCell>
                    <TableCell>{stat.number}+</TableCell>
                    <TableCell>{stat.sortOrder}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => router.push(`/admin/proud/stats/edit/${stat.id}`)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => handleDeleteStat(stat.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Marquee Tab Content */}
      {activeTab === "marquee" && (
        <div>
          {marquee.length === 0 ? (
            <p className="text-muted-foreground">No marquee items found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marquee.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      {item.img ? (
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="h-10 w-16 object-cover rounded bg-muted border"
                        />
                      ) : (
                        "No Image"
                      )}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => router.push(`/admin/proud/marquee/edit/${item.id}`)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => handleDeleteMarquee(item.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
