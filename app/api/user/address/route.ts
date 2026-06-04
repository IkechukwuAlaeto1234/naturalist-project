import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

// GET /api/user/address
// Fetch saved shipping address coordinates
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Default return address or empty object
    return NextResponse.json((user as any).shippingAddress || {}, { status: 200 });
  } catch (error) {
    console.error("GET user address error:", error);
    return NextResponse.json({ error: "Failed to retrieve address details" }, { status: 500 });
  }
}

// PUT /api/user/address
// Update saved shipping address coordinates
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { name, street, city, state, zip, country, phone } = await req.json();

    if (!name || !street || !city || !state || !zip || !country || !phone) {
      return NextResponse.json({ error: "All address fields are required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update shippingAddress object dynamically
    (user as any).shippingAddress = {
      name: name.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      country: country.trim(),
      phone: phone.trim(),
    };

    // Use markModified if it is a Mixed type
    user.markModified("shippingAddress");
    await user.save();

    return NextResponse.json((user as any).shippingAddress, { status: 200 });
  } catch (error) {
    console.error("PUT user address error:", error);
    return NextResponse.json({ error: "Failed to update address details" }, { status: 500 });
  }
}
