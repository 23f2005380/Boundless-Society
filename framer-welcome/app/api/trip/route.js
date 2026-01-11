import { NextResponse } from "next/server";
import * as yup from "yup";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
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
    .of(yup.string().trim())
    .test(
      "at-least-one",
      "At least one coordinator is required",
      (value) => value && value.some((c) => c && c.trim() !== "")
    ),
  totalSeats: yup
    .number()
    .typeError("Total seats must be a number")
    .required("Total seats is required")
    .positive("Total seats must be greater than 0")
    .integer("Total seats must be a whole number"),
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
});

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate using Yup
    const validatedData = await tripSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Filter out empty coordinators
    const validCoordinators = (validatedData.coordinators || []).filter(
      (c) => c && c.trim() !== ""
    );

    // Prepare trip data for Firestore
    const tripData = {
      name: validatedData.name,
      description: validatedData.description || "",
      coordinators: validCoordinators,
      totalSeats: validatedData.totalSeats,
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
          // Include options for radio/select fields, filtering out empty options
          if (field.type === "radio" || field.type === "select") {
            fieldData.options = (field.options || []).filter(
              (opt) => opt && opt.trim() !== ""
            );
          }
          return fieldData;
        }),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add to Firestore
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
        form: data.form,
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
