import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { serverTimestamp, addDoc, collection } from "firebase/firestore";

export async function POST(request) {
    try {
        const body = await request.json();
        const { token, formData } = body;

        if (!token) {
            return Response.json({ error: "Missing token" }, { status: 400 });
        }

        // ✅ Verify the Firebase ID token
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (err) {
            return Response.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        const uid = decodedToken.uid;
        const email = decodedToken.email;

        await addDoc(collection(db, "user-registrations"),{
            uid,
            email,
            formData: formData || {},
            submittedAt: serverTimestamp(),
        });

        return Response.json({ success: true, message: "Trip Registration successful!" }, { status: 200 });

    } catch (error) {
        console.error("API Error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}