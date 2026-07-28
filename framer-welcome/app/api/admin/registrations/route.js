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

import { sendApprovalEmail } from "@/lib/brevo";

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
        studentIdVerified: data.studentIdVerified || false,
        consentFormVerified: data.consentFormVerified || false,
        verifiedConsentForms: data.verifiedConsentForms || {},
        issueText: data.issueText || "",
        actionRequiredFields: data.actionRequiredFields || [],
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
    return NextResponse.json({ error: "Failed to fetch registrations. Please try again." }, { status: 500 });
  }
}

/* POST → Update individual registration status (e.g. approve to pay, reject) */
export async function POST(req) {
  try {
    const clone = req.clone();
    const body = await clone.json();
    const { registrationId, status, studentIdVerified, consentFormVerified, verifiedConsentForms, issueText, actionRequiredFields } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Missing registrationId" },
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

    const updatePayload = {
      updatedAt: serverTimestamp(),
    };

    if (verifiedConsentForms !== undefined) {
      const existingMap = regSnap.data().verifiedConsentForms || {};
      const newMap = { ...existingMap, ...verifiedConsentForms };
      updatePayload.verifiedConsentForms = newMap;

      // Auto check if all are verified
      const tripDocRef = doc(db, "trips", tripId);
      const tripSnap = await getDoc(tripDocRef);
      if (tripSnap.exists()) {
        const tripData = tripSnap.data();
        const templates = tripData.consentTemplates && tripData.consentTemplates.length > 0
          ? tripData.consentTemplates
          : (tripData.consentFormTemplateUrl ? [{ id: "legacy-consent" }] : []);
        
        let allOk = true;
        for (const t of templates) {
          if (!newMap[t.id]) {
            allOk = false;
            break;
          }
        }
        if (templates.length > 0 && allOk) {
          updatePayload.consentFormVerified = true;
        } else if (templates.length > 0) {
          updatePayload.consentFormVerified = false;
        }
      }
    }

    if (consentFormVerified !== undefined) {
      updatePayload.consentFormVerified = consentFormVerified;
    }

    if (studentIdVerified !== undefined) {
      updatePayload.studentIdVerified = studentIdVerified;
    }

    if (status === "approved_to_pay") {
      const isVerified = studentIdVerified !== undefined ? studentIdVerified : (regSnap.data().studentIdVerified || false);
      if (!isVerified) {
        return NextResponse.json(
          { error: "Student ID must be verified before approving registration." },
          { status: 400 }
        );
      }

      // Check if consent form is required and verified
      const tripDocRef = doc(db, "trips", tripId);
      const tripSnap = await getDoc(tripDocRef);
      if (tripSnap.exists()) {
        const tripData = tripSnap.data();
        const hasConsent = tripData.consentFormTemplateUrl || (tripData.consentTemplates && tripData.consentTemplates.length > 0);
        if (hasConsent) {
          const isConsentVerifiedNow = updatePayload.consentFormVerified !== undefined ? updatePayload.consentFormVerified : consentFormVerified;
          const isConsentVerified = isConsentVerifiedNow !== undefined ? isConsentVerifiedNow : (regSnap.data().consentFormVerified || false);
          if (!isConsentVerified) {
            return NextResponse.json(
              { error: "Consent Form must be verified before approving registration." },
              { status: 400 }
            );
          }
        }
      }
    }
    if (status !== undefined) updatePayload.status = status;
    if (studentIdVerified !== undefined) {
      updatePayload.studentIdVerified = studentIdVerified;
    } else if (aadhaarVerified !== undefined) {
      updatePayload.studentIdVerified = aadhaarVerified;
    }
    if (consentFormVerified !== undefined) {
      updatePayload.consentFormVerified = consentFormVerified;
    }
    if (issueText !== undefined) updatePayload.issueText = issueText;
    if (actionRequiredFields !== undefined) updatePayload.actionRequiredFields = actionRequiredFields;

    const oldStatus = regSnap.data().status || "registered";
    const gender = (regSnap.data().gender || "unknown").toLowerCase();

    if (status !== undefined && status !== oldStatus) {
      const isConfirmedState = (s) => s === "approved_to_pay" || s === "paid" || s === "mail_sent";
      const wasConfirmed = isConfirmedState(oldStatus);
      const isConfirmed = isConfirmedState(status);

      if (isConfirmed !== wasConfirmed) {
        const tripDocRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripDocRef);
        if (tripSnap.exists()) {
          const tripData = tripSnap.data();
          let totalJoined = Number(tripData.totalJoined || 0);
          let femaleJoined = Number(tripData.femaleJoined || 0);
          const totalSeats = Number(tripData.totalSeats || 30);

          if (isConfirmed) {
            totalJoined += 1;
            if (gender === "female") femaleJoined += 1;
          } else {
            totalJoined = Math.max(0, totalJoined - 1);
            if (gender === "female") femaleJoined = Math.max(0, femaleJoined - 1);
          }

          const tripUpdate = {
            totalJoined,
            femaleJoined,
          };
          if (totalJoined >= totalSeats) {
            tripUpdate.registrationOpen = false;
            tripUpdate.paymentOpen = false;
          }
          await updateDoc(tripDocRef, tripUpdate);
        }
      }

      // Trigger Brevo Email if moving into confirmed/approved state
      if (status === "approved_to_pay") {
        const tripDocRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripDocRef);
        if (tripSnap.exists()) {
          const tripData = tripSnap.data();
          const userEmail = regSnap.data().email;
          const nameKey = Object.keys(regSnap.data().formData || {}).find(
            (k) => k.toLowerCase().includes("name") || k.toLowerCase().includes("fullname")
          );
          const userName = nameKey ? regSnap.data().formData[nameKey] : "Attendee";
          const tripName = tripData.name || "Event";
          const whatsappLink = tripData.whatsappLink || "";
          const qrCodeUrl = tripData.qrCodeUrl || "";

          try {
            const emailResult = await sendApprovalEmail(userEmail, userName, tripName, whatsappLink, qrCodeUrl);
            if (emailResult) {
              updatePayload.status = "mail_sent";
            }
          } catch (emailErr) {
            console.error("Failed to send Brevo email:", emailErr);
          }
        }
      }
    }

    await updateDoc(regRef, updatePayload);

    return NextResponse.json({ success: true, message: "Registration updated successfully" });
  } catch (error) {
    console.error("POST Admin Registration Status Error:", error);
    return NextResponse.json({ error: "Failed to update registration. Please try again." }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to update trip settings. Please try again." }, { status: 500 });
  }
}
