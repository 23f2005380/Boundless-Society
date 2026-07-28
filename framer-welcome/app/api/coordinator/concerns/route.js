import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
  getDoc
} from "firebase/firestore";

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

    if (!tripId) {
      return true;
    }

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    const studentEmail = searchParams.get("studentEmail");

    const authorized = await checkAuth(request, tripId);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    let q;
    const concernsRef = collection(db, "coordinator_concerns");

    if (tripId && studentEmail) {
      q = query(
        concernsRef,
        where("tripId", "==", tripId),
        where("studentEmail", "==", studentEmail)
      );
    } else if (studentEmail) {
      q = query(
        concernsRef,
        where("studentEmail", "==", studentEmail)
      );
    } else if (tripId) {
      q = query(
        concernsRef,
        where("tripId", "==", tripId)
      );
    } else {
      q = query(concernsRef);
    }

    const snapshot = await getDocs(q);
    const concerns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    // Sort in-memory by createdAt desc
    concerns.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({ concerns }, { status: 200 });
  } catch (error) {
    console.error("GET Concerns Error:", error);
    return NextResponse.json({ error: "Failed to fetch concerns. Please try again." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.clone().json();
    const { tripId, studentEmail, concernText } = body;

    if (!tripId || !studentEmail || !concernText) {
      return NextResponse.json(
        { error: "Missing required fields (tripId, studentEmail, concernText)" },
        { status: 400 }
      );
    }

    const authorized = await checkAuth(request, tripId);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Extract coordinatorEmail from the verified token (never trust client-supplied value)
    let coordinatorEmail = "coordinator";
    try {
      const { searchParams } = new URL(request.url);
      let token = searchParams.get("token") || body.token;
      if (token) {
        const decoded = await adminAuth.verifyIdToken(token);
        coordinatorEmail = decoded.email || "coordinator";
      }
    } catch (_) { /* session-based auth — use fallback */ }

    // Check if trip is completed
    const tripSnap = await getDoc(doc(db, "trips", tripId));
    if (tripSnap.exists() && tripSnap.data().isCompleted) {
      return NextResponse.json(
        { error: "Trip is completed. Cannot add concerns." },
        { status: 400 }
      );
    }

    const docRef = await addDoc(collection(db, "coordinator_concerns"), {
      tripId,
      studentEmail,
      coordinatorEmail,
      concernText,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("POST Concerns Error:", error);
    return NextResponse.json({ error: "An internal error occurred." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Concern ID is required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "coordinator_concerns", id));
    return NextResponse.json({ success: true, message: "Concern deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Concern Error:", error);
    return NextResponse.json({ error: "Failed to delete concern. Please try again." }, { status: 500 });
  }
}
