'use client';
import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Trip {
  id: string;
  title: string;
  registrationLink?: string;
  image?: string;
  details?: string;
  backgroundColor: string;
  textColor: string;
}


const page = () => {
  const [posts, setPosts] = useState<Trip[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "upcoming_trips"));
        const data: Trip[] = querySnapshot.docs.map((doc) => ({
          id:doc.id,
          title: doc.data().title,
          image: doc.data().imageUrl || "",
          details: doc.data().details || "",
          registrationLink: doc.data().registrationLink || "",
          backgroundColor: doc.data().backgroundColor || "bg-yellow-200",
          textColor: doc.data().textColor || "text-gray-800",
        }));

        setPosts(data);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (tripId: string) => {
  try {
    await deleteDoc(doc(db, "upcoming_trips", tripId));
    setPosts((prev) => prev.filter((trip) => trip.id !== tripId));
    alert("Trip deleted successfully ✅");
    window.location.reload();
  } catch (error) {
    console.error("Error deleting trip:", error);
    alert("Failed to delete trip");
  }
};


  return (
    <div className="flex justify-around h-full mt-4">
      <Link href="/admin/trip/upcoming/add" className="text-2xl w-[300px] h-auto bg-slate-400 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transform duration-300 flex items-center justify-center"><p>+ Add Trip Details</p></Link>
      {[...posts].map((trip) => (
        <div key={trip.id} className={`${trip.backgroundColor} ${trip.textColor}  h-full w-[300px] flex flex-col gap-2 p-2 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transform duration-300`}>
          <h2 className=" font-bold text-2xl">{trip.title}</h2>
          <img className="object-fit w-full" src={trip.image} alt="" />
          <div className="flex justify-around">
            <button className="p-2 rounded-xl bg-white">{trip.registrationLink}</button>
            <button className="p-2 rounded-xl bg-white">{trip.details}</button>
            <button className="p-2 rounded-xl bg-white hover:bg-red-500 transform duration-300"
              onClick={() => {
                if (confirm("Are you sure you want to delete this trip?")) {
                  handleDelete(trip.id);
                }
              }}
            >Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default page
