import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import {
  serverTimestamp,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc
} from "firebase/firestore";

/* GET → Check if registered & fetch autofill profile data */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const tripId = searchParams.get("tripId");

    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 400 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const email = decodedToken.email;

    // 1. Fetch current registration status for this specific trip
    let registration = null;
    if (tripId) {
      const currentQuery = query(
        collection(db, "user-registrations"),
        where("tripId", "==", tripId),
        where("email", "==", email),
        limit(1)
      );
      const currentSnap = await getDocs(currentQuery);
      if (!currentSnap.empty) {
        const docSnap = currentSnap.docs[0];
        registration = {
          id: docSnap.id,
          ...docSnap.data(),
          submittedAt: docSnap.data().submittedAt?.toDate?.()?.toISOString() || null,
        };
      }
    }

    // 2. Fetch past registration data to auto-fill
    let autofillData = null;
    const pastQuery = query(
      collection(db, "user-registrations"),
      where("email", "==", email)
    );
    const pastSnap = await getDocs(pastQuery);
    if (!pastSnap.empty) {
      const sortedDocs = [...pastSnap.docs].sort((a, b) => {
        const timeA = a.data().submittedAt?.toDate?.()?.getTime() || 0;
        const timeB = b.data().submittedAt?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });
      autofillData = sortedDocs[0].data().formData || null;
    }

    return Response.json({ registration, autofillData }, { status: 200 });
  } catch (error) {
    console.error("GET user-registration error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* POST → Create new registration */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, tripId, formData } = body;

    if (!token || !tripId || !formData) {
      return Response.json({ error: "Missing required fields (token, tripId, formData)" }, { status: 400 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Check if trip registration is open
    const tripSnap = await getDoc(doc(db, "trips", tripId));
    if (!tripSnap.exists()) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }
    const tripData = tripSnap.data();
    if (tripData.registrationOpen === false) {
      return Response.json({ error: "Registration for this trip is closed" }, { status: 400 });
    }

    // Prevent duplicate registrations
    const dupQuery = query(
      collection(db, "user-registrations"),
      where("tripId", "==", tripId),
      where("email", "==", email),
      limit(1)
    );
    const dupSnap = await getDocs(dupQuery);
    if (!dupSnap.empty) {
      return Response.json({ error: "You are already registered for this trip." }, { status: 400 });
    }

    // Automatically detect gender from formData keys (e.g. key containing "gender" or "sex")
    const genderKey = Object.keys(formData).find(
      (k) => k.toLowerCase().includes("gender") || k.toLowerCase() === "sex"
    );
    let gender = "unknown";
    if (genderKey) {
      const val = String(formData[genderKey]).toLowerCase();
      if (val.startsWith("f")) gender = "female";
      else if (val.startsWith("m")) gender = "male";
      else gender = "other";
    }

    const docRef = await addDoc(collection(db, "user-registrations"), {
      uid,
      email,
      tripId,
      formData: formData || {},
      status: "registered", // initial stage
      gender,
      submittedAt: serverTimestamp(),
    });

    return Response.json(
      { success: true, message: "Trip Registration successful!", id: docRef.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST user-registration error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}