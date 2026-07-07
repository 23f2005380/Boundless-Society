// app/api/election/seed-voters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import fs from "fs";
import path from "path";

// Mappings from Excel sheet department strings to the 7 official HOD departments
const DEPT_MAP: Record<string, string> = {
  "Technical Team": "Technical Team",
  "technical Team": "Technical Team",
  "Public Relation": "Research & Outreach",
  "Research Team": "Research & Outreach",
  "Graphic Designing and Documentation": "Graphics Team",
  "City Operations": "City Operations",
  "Female's Corner": "Females Corner",
  "Media Team": "Media Team",
  "Trip Coordination": "Trip Coordination",
};

interface ExcelVoter {
  Name: string;
  Department: string;
  Mail: string;
  Role: string;
}

export async function GET(req: NextRequest) {
  // Simple query-param protection
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== "boundless_admin_secret_99") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const votersFilePath = path.join(process.cwd(), "voters.json");
    if (!fs.existsSync(votersFilePath)) {
      return NextResponse.json({ error: "voters.json file not found. Run the python script first." }, { status: 404 });
    }

    const fileContent = fs.readFileSync(votersFilePath, "utf8");
    const excelVoters: ExcelVoter[] = JSON.parse(fileContent);

    // Deduplicate by email and map
    const votersMap = new Map<string, { email: string; name: string; department: string; isPreviousHOD: boolean }>();

    for (const v of excelVoters) {
      if (!v.Mail || !v.Mail.trim()) continue;
      const email = v.Mail.trim().toLowerCase();
      const mappedDept = DEPT_MAP[v.Department] || "Technical Team";
      const isPreviousHOD = v.Role === "HOD";

      if (!votersMap.has(email)) {
        votersMap.set(email, {
          email,
          name: v.Name ? v.Name.trim() : "Unknown Voter",
          department: mappedDept,
          isPreviousHOD,
        });
      }
    }

    const votersToCreate = Array.from(votersMap.values());
    const results = {
      totalInExcel: excelVoters.length,
      deduplicated: votersToCreate.length,
      created: 0,
      errors: [] as string[],
    };

    const defaultPassword = "Voter@boundless2024";

    for (const voter of votersToCreate) {
      try {
        let userRecord;
        try {
          // Check if user already exists in Firebase Auth
          userRecord = await adminAuth.getUserByEmail(voter.email);
        } catch (authErr: any) {
          // If user does not exist, create them
          if (authErr.code === "auth/user-not-found") {
            userRecord = await adminAuth.createUser({
              email: voter.email,
              password: defaultPassword,
              displayName: voter.name,
            });
          } else {
            throw authErr;
          }
        }

        // Set or update their document in Firestore council_members
        const memberRef = adminDb.collection("council_members").doc(userRecord.uid);
        const memberSnap = await memberRef.get();

        // If they already exist in Firestore, don't overwrite hasVoted
        const existingData = memberSnap.exists ? memberSnap.data() : null;
        await memberRef.set({
          email: voter.email,
          name: voter.name,
          department: voter.department,
          isPreviousHOD: voter.isPreviousHOD,
          isContestingAgain: existingData?.isContestingAgain ?? false,
          hasVoted: existingData?.hasVoted ?? false,
        }, { merge: true });

        results.created++;
      } catch (err: any) {
        results.errors.push(`Error for ${voter.email}: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("Seeding failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
