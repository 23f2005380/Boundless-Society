import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

// Cleaned hardcoded seed data with text descriptions instead of React elements
const initialCampaigns = [
  {
    city: "TRI-COLOR TRAILS 3.0 ",
    img: "/city-meet/tri_color.jpg",
    title: "TRI-COLOR TRAILS 3.0 ",
    description: "Boundless brings you the most celebrated and lived event of the year - Tri Color Trails 3.0, a New Year gift to make your year truly unforgettable ✨",
    badge: "",
    logo: "",
  },
  {
    city: "Navrang 2.0",
    img: "/city-meet/Navrang2.jpg",
    title: "Navrang 2.0",
    description: "Celebrate the spirit of Navratri with Navrang 2.0, a vibrant series of energetic garba nights to unforgettable festive vibes organized by IIT Madras Boundless Travel Society & Team. Hosted across 13+ cities, this colorful celebration brings together over 350+ attendees to enjoy music, dance, and culture.",
    badge: "",
    logo: "",
  },
  {
    city: "Tricolor Trails 2.0",
    img: "/city-meet/TricolorTrails2.jpg",
    title: "Tricolor Trails 2.0",
    description: "Each city meetup fosters travel spirit, collaboration, and patriotism — bringing young travelers together to rediscover India’s diverse beauty and shared identity under one tricolor. This year’s journey connects students from Delhi, Mumbai, Jaipur, Indore, Nagpur, Chennai, Bangalore, Kolkata, Patna, Gorakhpur, Bhubaneswar, and Jamshedpur.",
    badge: "",
    logo: "",
  },
  {
    city: "Pandal Hopping",
    img: "https://res.cloudinary.com/duuyaejwy/image/upload/v1761071424/Pandaal_jaex4i.jpg",
    title: "Pandal Hopping",
    description: "Durga Pandal Hopping across 10+ Cities! Boundless brought the Navratri spirit alive — from the dazzling lights of Delhi to the festive vibes of Kolkata, 1000+ members came together to celebrate the colors, culture, and joy of Durga Puja. Massive love to everyone who showed up and to our incredible city teams who made it all possible!",
    badge: "",
    logo: "",
  },
  {
    city: "Republic Day",
    img: "https://res.cloudinary.com/duuyaejwy/image/upload/v1761071425/Republic_ue8kvu.jpg",
    title: "Republic Day Meetups",
    description: "Tri-Color Meetups across 12 Cities! Boundless Society x Kanha House is all set to celebrate Republic Day with vibrant meetups in Lucknow, Jaipur, Nagpur, Delhi, Indore, Patna, Chennai, Bangalore, Gorakhpur, Jodhpur, Mumbai & Salem — let’s make it memorable together!",
    badge: "",
    logo: "",
  },
  {
    city: "Summer",
    img: "https://res.cloudinary.com/duuyaejwy/image/upload/v1761071426/Summer_wvuhlg.jpg",
    title: "Summer Meetups",
    description: "Summer Meetups Across 10 Cities – Wrapped! Boundless Travel Society successfully brought the summer vibes to Mumbai, Bhopal, Udaipur, Jaipur, Indore, Gwalior, Patna, Gaya, Tezpur & Kolkata this April & May — an unforgettable series of memories, bonds, and pure energy!",
    badge: "",
    logo: "",
  },
];

// Function to seed Firestore if empty
async function seedIfEmpty() {
  try {
    const campaignsRef = collection(db, "meetup_campaigns");
    const qSnapshot = await getDocs(campaignsRef);
    if (qSnapshot.empty) {
      console.log("Meetup campaigns collection is empty. Seeding initial data...");
      const batch = writeBatch(db);
      initialCampaigns.forEach((c, idx) => {
        const docRef = doc(collection(db, "meetup_campaigns"));
        batch.set(docRef, {
          city: c.city,
          img: c.img || "",
          title: c.title,
          description: c.description,
          badge: c.badge || "",
          logo: c.logo || "",
          sortOrder: idx,
          createdAt: new Date(),
        });
      });
      await batch.commit();
      console.log("Successfully seeded meetup campaigns.");
    }
  } catch (error) {
    console.error("Error seeding meetup campaigns:", error);
  }
}

/* GET All Campaigns OR Single Campaign (if ?id= is passed) */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const docRef = doc(db, "meetup_campaigns", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }
      return NextResponse.json({ campaign: { id: docSnap.id, ...docSnap.data() } }, { status: 200 });
    }

    await seedIfEmpty();

    const campaignsRef = collection(db, "meetup_campaigns");
    const q = query(campaignsRef, orderBy("sortOrder", "asc"));
    const querySnapshot = await getDocs(q);

    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt desc in-memory if sortOrder is equal
    data.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ campaigns: data }, { status: 200 });
  } catch (error) {
    console.error("GET Campaigns Error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

/* POST: Save new campaign */
export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.city || !body.title || !body.img || !body.description) {
      return NextResponse.json({ error: "City, title, description and image are required" }, { status: 400 });
    }

    const campaignData = {
      city: body.city,
      img: body.img,
      title: body.title,
      description: body.description,
      badge: body.badge || "",
      logo: body.logo || "",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : parseInt(body.sortOrder) || 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "meetup_campaigns"), campaignData);
    return NextResponse.json({ message: "Campaign added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("POST Campaign Error:", error);
    return NextResponse.json({ error: "Failed to save campaign" }, { status: 500 });
  }
}

/* PUT: Update campaign */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, city, img, title, description, badge, logo, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updateData = {
      city,
      img: img || "",
      title,
      description,
      badge: badge || "",
      logo: logo || "",
      sortOrder: typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder) || 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "meetup_campaigns", id), updateData);
    return NextResponse.json({ success: true, message: "Campaign updated" }, { status: 200 });
  } catch (error) {
    console.error("PUT Campaign Error:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

/* DELETE: Remove campaign */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "meetup_campaigns", id));
    return NextResponse.json({ success: true, message: "Campaign deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Campaign Error:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
