import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// Helper function to archive the attendee and coordinator rosters
async function archiveEventRoster(tripId) {
  try {
    const tripDocRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripDocRef);
    if (!tripSnap.exists()) return;
    const tripData = tripSnap.data();

    // 1. Fetch all paid attendees for this trip
    const regQuery = query(
      collection(db, "user-registrations"),
      where("tripId", "==", tripId),
      where("status", "==", "paid")
    );
    const regSnap = await getDocs(regQuery);
    const attendees = regSnap.docs.map((d) => {
      const data = d.data();
      const nameKey = Object.keys(data.formData || {}).find(
        (k) => k.toLowerCase().includes("name") || k.toLowerCase().includes("fullname")
      );
      const studentName = nameKey ? data.formData[nameKey] : "Student";
      return {
        uid: data.uid,
        email: data.email,
        name: studentName,
        gender: data.gender || "unknown",
        paymentVerifiedAt: data.paymentVerifiedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // 2. Save archived roster
    const archiveRef = doc(db, "archived_rosters", tripId);
    await setDoc(archiveRef, {
      tripId,
      tripName: tripData.name || "Unnamed Trip",
      coordinators: tripData.coordinators || [],
      attendees,
      closedAt: new Date(),
    });

    // 3. Mark trip roster as saved
    await updateDoc(tripDocRef, {
      finalRosterSaved: true,
    });
    console.log(`Successfully archived event roster for trip ${tripId} with ${attendees.length} paid attendees.`);
  } catch (error) {
    console.error("Error archiving event roster:", error);
  }
}

async function checkAuth(req, tripId) {
  try {
    const session = await getServerSession();
    if (session) return true;

    const { searchParams } = new URL(req.url);
    let token = searchParams.get("token");

    if (!token && req.method !== "GET" && req.method !== "HEAD") {
      try {
        const clone = req.clone();
        const body = await clone.json();
        token = body.token;
      } catch (e) {
        // ignore
      }
    }

    if (!token) return false;

    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email;
    if (!email) return false;

    // Check if user coordinates this trip
    const tripSnap = await getDoc(doc(db, "trips", tripId));
    if (!tripSnap.exists()) return false;
    const tripData = tripSnap.data();

    const isCoordinated = (tripData.coordinators || []).some((c) => {
      if (typeof c === "object" && c !== null) {
        return c.email?.toLowerCase() === email.toLowerCase();
      }
      return String(c).toLowerCase() === email.toLowerCase();
    });

    return isCoordinated;
  } catch (err) {
    console.error("Auth check failed:", err);
    return false;
  }
}

/* GET → Retrieve all registrations for a trip */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const authorized = await checkAuth(req, tripId);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const q = query(
      collection(db, "user-registrations"),
      where("tripId", "==", tripId)
    );
    const snapshot = await getDocs(q);
    const registrations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        uid: data.uid,
        status: data.status || "registered",
        gender: data.gender || "unknown",
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || null,
        paymentVerifiedAt: data.paymentVerifiedAt?.toDate?.()?.toISOString() || null,
        formData: data.formData || {},
      };
    });

    // Sort in-memory by submittedAt desc
    registrations.sort((a, b) => {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({ registrations }, { status: 200 });
  } catch (error) {
    console.error("GET Admin Registrations Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* POST → Update individual registration status (e.g. approve to pay, reject) */
export async function POST(req) {
  try {
    const clone = req.clone();
    const body = await clone.json();
    const { registrationId, status } = body;

    if (!registrationId || !status) {
      return NextResponse.json(
        { error: "Missing registrationId or status" },
        { status: 400 }
      );
    }

    const regRef = doc(db, "user-registrations", registrationId);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    const tripId = regSnap.data().tripId;

    const authorized = await checkAuth(req, tripId);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await updateDoc(regRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: `Registration status updated to ${status}` });
  } catch (error) {
    console.error("POST Admin Registration Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* PUT → Update event-level configuration (switches, seats, quota) */
export async function PUT(req) {
  try {
    const clone = req.clone();
    const body = await clone.json();
    const {
      tripId,
      registrationOpen,
      paymentOpen,
      totalSeats,
      predefinedGirlsThreshold,
      isCompleted
    } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const authorized = await checkAuth(req, tripId);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const tripRef = doc(db, "trips", tripId);

    const updateData = {};
    if (registrationOpen !== undefined) updateData.registrationOpen = registrationOpen;
    if (paymentOpen !== undefined) updateData.paymentOpen = paymentOpen;
    if (totalSeats !== undefined) updateData.totalSeats = Number(totalSeats);
    if (predefinedGirlsThreshold !== undefined) {
      updateData.predefinedGirlsThreshold = Number(predefinedGirlsThreshold);
    }
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted === true) {
        updateData.registrationOpen = false;
        updateData.paymentOpen = false;
      }
    }

    await updateDoc(tripRef, updateData);

    // If registrations or payments were toggled to CLOSED, or marked completed, trigger roster archive
    if (registrationOpen === false || paymentOpen === false || isCompleted === true) {
      await archiveEventRoster(tripId);
    }

    return NextResponse.json({ success: true, message: "Trip settings updated successfully" });
  } catch (error) {
    console.error("PUT Trip Settings Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
