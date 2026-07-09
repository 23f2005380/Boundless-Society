import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as yup from "yup";
import { db, isFirebaseEnabled } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

const formFieldSchema = yup.object().shape({
  id: yup.string().required(),
  name: yup.string().required("Field name is required").trim(),
  type: yup
    .string()
    .oneOf(
      ["short_text", "long_text", "radio", "select", "date", "file", "email"],
      "Invalid field type"
    )
    .required(),
  sortOrder: yup.number().required().min(0),
  options: yup
    .array()
    .of(yup.string().trim())
    .when("type", {
      is: (type) => type === "radio" || type === "select",
      then: (schema) =>
        schema
          .min(1, "At least one option is required for radio/select fields")
          .test(
            "has-valid-option",
            "At least one non-empty option is required",
            (value) => value && value.some((opt) => opt && opt.trim() !== "")
          ),
      otherwise: (schema) => schema.optional(),
    }),
});

const tripSchema = yup.object().shape({
  name: yup.string().required("Trip name is required").trim(),
  description: yup.string().trim(),
  coordinators: yup
    .array()
    .of(
      yup.lazy((val) => {
        if (typeof val === "object" && val !== null) {
          return yup.object().shape({
            name: yup.string().required("Coordinator name is required").trim(),
            email: yup.string().email("Invalid email").required("Coordinator email is required").trim(),
          });
        }
        return yup.string().trim();
      })
    )
    .test(
      "at-least-one",
      "At least one coordinator is required",
      (value) => value && value.length > 0
    ),
  totalSeats: yup
    .number()
    .typeError("Total seats must be a number")
    .required("Total seats is required")
    .positive("Total seats must be greater than 0")
    .integer("Total seats must be a whole number"),
  fee: yup.number().min(0).default(500),
  consentFormTemplateUrl: yup.string().trim().optional(),
  femaleReservedSeats: yup
    .number()
    .typeError("Female reserved seats must be a number")
    .required("Female reserved seats is required")
    .min(0, "Cannot be negative")
    .integer("Must be a whole number"),
  releasedSeats: yup
    .number()
    .typeError("Released seats must be a number")
    .required("Released seats is required")
    .min(0, "Cannot be negative")
    .integer("Must be a whole number"),
  releasedSeatsType: yup
    .string()
    .oneOf(["female_only", "all"], "Invalid type")
    .required(),
  femaleJoined: yup.number().default(0),
  totalJoined: yup.number().default(0),
  formFields: yup
    .array()
    .of(formFieldSchema)
    .min(1, "At least one form field is required")
    .required("Form fields are required"),
  images: yup
    .array()
    .of(
      yup.object().shape({
        url: yup.string().required(),
        publicId: yup.string().required(),
        sortOrder: yup.number().required(),
      })
    )
    .default([]),
});

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isFirebaseEnabled || !db) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const body = await request.json();

    const validatedData = await tripSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const validCoordinators = (validatedData.coordinators || []).map((c) => {
      if (typeof c === "object" && c !== null) {
        return {
          name: String(c.name || "").trim(),
          email: String(c.email || "").trim(),
        };
      }
      return String(c).trim();
    }).filter((c) => {
      if (typeof c === "object" && c !== null) {
        return c.name && c.email;
      }
      return c !== "";
    });

    const tripData = {
      name: validatedData.name,
      description: validatedData.description || "",
      coordinators: validCoordinators,
      totalSeats: validatedData.totalSeats,
      fee: validatedData.fee !== undefined ? Number(validatedData.fee) : 500,
      consentFormTemplateUrl: validatedData.consentFormTemplateUrl || "",
      femaleReservedSeats: validatedData.femaleReservedSeats,
      releasedSeats: validatedData.releasedSeats,
      releasedSeatsType: validatedData.releasedSeatsType,
      femaleJoined: validatedData.femaleJoined || 0,
      totalJoined: validatedData.totalJoined || 0,
      form: {
        fields: validatedData.formFields.map((field) => {
          const fieldData = {
            id: field.id,
            name: field.name,
            type: field.type,
            sortOrder: field.sortOrder,
          };
          if (field.type === "radio" || field.type === "select") {
            fieldData.options = (field.options || []).filter(
              (opt) => opt && opt.trim() !== ""
            );
          }
          return fieldData;
        }),
      },
      images: (validatedData.images || []).map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        sortOrder: index,
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "trips"), tripData);

    return NextResponse.json(
      {
        message: "Trip created successfully",
        tripId: docRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating trip:", error);

    if (error instanceof yup.ValidationError) {
      const validationErrors = {};
      error.inner.forEach((err) => {
        if (err.path) {
          validationErrors[err.path] = err.message;
        }
      });
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create trip. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!isFirebaseEnabled || !db) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const tripsRef = collection(db, "trips");
    const q = query(tripsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const trips = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        coordinators: data.coordinators,
        totalSeats: data.totalSeats,
        femaleReservedSeats: data.femaleReservedSeats,
        releasedSeats: data.releasedSeats,
        releasedSeatsType: data.releasedSeatsType,
        femaleJoined: data.femaleJoined,
        totalJoined: data.totalJoined,
        registrationOpen: data.registrationOpen,
        paymentOpen: data.paymentOpen,
        predefinedGirlsThreshold: data.predefinedGirlsThreshold,
        isCompleted: data.isCompleted,
        finalRosterSaved: data.finalRosterSaved,
        form: data.form,
        consentFormTemplateUrl: data.consentFormTemplateUrl || "",
        images: data.images || [],
        fee: data.fee !== undefined ? Number(data.fee) : 500,
        razorpayKeyId: data.razorpayKeyId || "",
        hasRazorpaySecret: !!data.razorpayKeySecret,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ trips }, { status: 200 });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isFirebaseEnabled || !db) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "trips", id));
    return NextResponse.json({ success: true, message: "Trip deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Trip Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isFirebaseEnabled || !db) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { tripId, name, description, coordinators, totalSeats, formFields, fee, consentFormTemplateUrl } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const tripRef = doc(db, "trips", tripId);
    const updateData = {
      updatedAt: serverTimestamp(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (coordinators !== undefined) {
      updateData.coordinators = coordinators.map((c) => {
        if (typeof c === "object" && c !== null) {
          return {
            name: String(c.name || "").trim(),
            email: String(c.email || "").trim(),
          };
        }
        return String(c).trim();
      });
    }
    if (totalSeats !== undefined) updateData.totalSeats = Number(totalSeats);
    if (fee !== undefined) updateData.fee = Number(fee);
    if (consentFormTemplateUrl !== undefined) updateData.consentFormTemplateUrl = consentFormTemplateUrl;
    
    if (formFields !== undefined) {
      updateData.form = {
        fields: formFields.map((field, idx) => {
          const fieldData = {
            id: field.id || crypto.randomUUID(),
            name: field.name,
            type: field.type,
            sortOrder: field.sortOrder !== undefined ? field.sortOrder : idx,
          };
          if (field.type === "radio" || field.type === "select") {
            fieldData.options = (field.options || []).filter(
              (opt) => opt && opt.trim() !== ""
            );
          }
          return fieldData;
        })
      };
    }

    await updateDoc(tripRef, updateData);
    return NextResponse.json({ success: true, message: "Trip details updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("PUT Trip Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
