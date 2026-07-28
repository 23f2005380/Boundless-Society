import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp, isStaffRequest } from "@/lib/rateLimit";
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
  getDoc,
  updateDoc
} from "firebase/firestore";

/* GET → Check if registered & fetch autofill profile data */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : searchParams.get("token");
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

    if (!email || !email.endsWith("iitm.ac.in")) {
      return Response.json({ error: "Unauthorized domain. Only IITM emails are allowed." }, { status: 403 });
    }

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
    let token = null;
    const authHeader = request.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      try {
        const clone = request.clone();
        const body = await clone.json();
        token = body.token;
      } catch (e) {}
    }

    const isStaff = await isStaffRequest(null, token);
    if (!isStaff) {
      // Rate limit: 5 new registrations per IP per 10 minutes
      const ip = getClientIp(request);
      const rl = checkRateLimit(`register:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
      if (!rl.allowed) {
        return Response.json(
          { error: "Too many requests. Please wait a few minutes before trying again." },
          { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
        );
      }
    }
    const body = await request.json();
    const { tripId, formData } = body;

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

    if (!email || !email.endsWith("iitm.ac.in")) {
      return Response.json({ error: "Unauthorized domain. Only IITM emails are allowed." }, { status: 403 });
    }

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

    // Fetch user's past registrations to enforce read-only prefilled data
    const pastQuery = query(
      collection(db, "user-registrations"),
      where("email", "==", email)
    );
    const pastSnap = await getDocs(pastQuery);
    let pastFormData = null;
    if (!pastSnap.empty) {
      const sortedDocs = [...pastSnap.docs].sort((a, b) => {
        const timeA = a.data().submittedAt?.toDate?.()?.getTime() || 0;
        const timeB = b.data().submittedAt?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });
      pastFormData = sortedDocs[0].data().formData || null;
    }

    if (pastFormData) {
      // Force reuse of past Student ID copy if it exists
      const pastIdCopy = pastFormData["Student ID Card Copy"];
      if (pastIdCopy) {
        formData["Student ID Card Copy"] = pastIdCopy;
      }

      // Enforce read-only logic on fields configured by the admin
      if (tripData?.form?.fields) {
        tripData.form.fields.forEach((field) => {
          if (field.allowEditIfPrefilled === false && pastFormData[field.name] !== undefined) {
            formData[field.name] = pastFormData[field.name];
          }
        });
      }
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

    // Check if user has a verified Student ID in past registrations
    const pastRegsQuery = query(
      collection(db, "user-registrations"),
      where("email", "==", email),
      where("studentIdVerified", "==", true),
      limit(1)
    );
    const pastRegsSnap = await getDocs(pastRegsQuery);
    const isIdVerified = !pastRegsSnap.empty;

    const docRef = await addDoc(collection(db, "user-registrations"), {
      uid,
      email,
      tripId,
      formData: formData || {},
      status: "registered", // initial stage
      gender,
      submittedAt: serverTimestamp(),
      studentIdVerified: isIdVerified,
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

/* PATCH → Update registration (e.g. re-upload documents) */
export async function PATCH(request) {
  try {
    // Check if caller is admin or coordinator to skip rate limit
    let token = null;
    const authHeader = request.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      try {
        const clone = request.clone();
        const body = await clone.json();
        token = body.token;
      } catch (e) {}
    }

    const isStaff = await isStaffRequest(null, token);
    if (!isStaff) {
      // Rate limit: 10 file re-uploads per IP per 5 minutes
      const ip = getClientIp(request);
      const rl = checkRateLimit(`patch-reg:${ip}`, { limit: 10, windowMs: 5 * 60_000 });
      if (!rl.allowed) {
        return Response.json(
          { error: "Too many requests. Please wait before retrying." },
          { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
        );
      }
    }
    const body = await request.json();
    const { tripId, formDataUpdates } = body;

    if (!token || !tripId || !formDataUpdates) {
      return Response.json({ error: "Missing required fields (token, tripId, formDataUpdates)" }, { status: 400 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const email = decodedToken.email;
    if (!email || !email.endsWith("iitm.ac.in")) {
      return Response.json({ error: "Unauthorized domain. Only IITM emails are allowed." }, { status: 403 });
    }

    // Find the current registration
    const currentQuery = query(
      collection(db, "user-registrations"),
      where("tripId", "==", tripId),
      where("email", "==", email),
      limit(1)
    );
    const currentSnap = await getDocs(currentQuery);
    
    if (currentSnap.empty) {
      return Response.json({ error: "Registration not found." }, { status: 404 });
    }

    const regDoc = currentSnap.docs[0];
    const existingData = regDoc.data();

    // Allow-list: only accept keys that belong to this trip's form fields or special document fields
    const tripSnap = await getDoc(doc(db, "trips", tripId));
    const tripFields = tripSnap.exists() ? (tripSnap.data()?.form?.fields || []) : [];
    const allowedKeys = new Set([
      ...tripFields.map((f) => f.name),
      "Student ID Card Copy",
      "Completed Consent Form",
      "User Reply",
    ]);

    const safeUpdates = Object.fromEntries(
      Object.entries(formDataUpdates).filter(([k]) => {
        return allowedKeys.has(k) || k.startsWith("Completed Consent -");
      })
    );

    if (Object.keys(safeUpdates).length === 0) {
      return Response.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const newFormData = { ...existingData.formData, ...safeUpdates };

    await updateDoc(doc(db, "user-registrations", regDoc.id), {
      formData: newFormData,
      status: "registered", // send back to under review
      issueText: "", // clear any issues
      actionRequiredFields: [], // clear flagged fields
      updatedAt: serverTimestamp(),
    });

    return Response.json({ success: true, message: "Registration updated successfully." }, { status: 200 });
  } catch (error) {
    console.error("PATCH user-registration error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}