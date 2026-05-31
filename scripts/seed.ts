import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define MONGODB_URI in your .env.local file");
  process.exit(1);
}

// Inline schemas to bypass Next.js compilation paths
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    images: { type: [String], required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    benefits: { type: [String], default: [] },
    ingredients: { type: [String], default: [] },
    usage: { type: String },
  },
  { timestamps: true }
);

const BundleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    images: { type: [String], required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Bundle = mongoose.models.Bundle || mongoose.model("Bundle", BundleSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const productsData = [
  {
    name: "Clarifying Sage Facial Cleanser",
    description: "A purifying, non-stripping facial cleanser infused with white sage, cucumber extract, and soothing aloe vera.",
    price: 24.00,
    compareAtPrice: 28.00,
    images: ["/cdn/products/cleanser-1.jpg"],
    category: "Cleanser",
    stock: 120,
    isFeatured: true,
    isActive: true,
    benefits: ["Deeply cleanses pores", "Controls excess oil", "Calms redness"],
    ingredients: ["Organic White Sage Extract", "Fresh Cucumber Distillate"],
    usage: "Massage onto damp face. Rinse thoroughly."
  },
  {
    name: "Botanical Bakuchiol Glow Serum",
    description: "An exceptional plant-based retinoid alternative that targets fine lines, uneven tone, and dark spots.",
    price: 48.00,
    compareAtPrice: 55.00,
    images: ["/cdn/products/serum-1.jpg"],
    category: "Serum",
    stock: 85,
    isFeatured: true,
    isActive: true,
    benefits: ["Reduces fine lines", "Promotes cell turnover"],
    ingredients: ["2% Pure Bakuchiol", "Hyaluronic Acid"],
    usage: "Apply 3-4 drops to clean skin."
  },
  {
    name: "Rosewater Hydra-Mist Tonique",
    description: "A revitalizing facial mist distilled from organic Damask rose petals, organic green tea, and calming witch hazel.",
    price: 18.00,
    images: ["/cdn/products/toner-1.jpg"],
    category: "Toner",
    stock: 150,
    isFeatured: false,
    isActive: true,
    benefits: ["Instantly hydrates", "Restores optimal pH"],
    ingredients: ["100% Organic Damask Rose Hydrosol"],
    usage: "Mist generously over clean face."
  },
  {
    name: "Nourishing Avocado & Seaweed Cream",
    description: "A decadent, moisture-rich facial cream packed with cold-pressed avocado oil and nutrient-dense organic kelp extract.",
    price: 36.00,
    compareAtPrice: 42.00,
    images: ["/cdn/products/cream-1.jpg"],
    category: "Moisturizer",
    stock: 95,
    isFeatured: true,
    isActive: true,
    benefits: ["Intense moisture barrier support"],
    ingredients: ["Cold-Pressed Organic Avocado Oil"],
    usage: "Warm a pea-sized amount and pat onto face."
  },
  {
    name: "French Green Clay Detox Mask",
    description: "An intensive clarifying treatment made with raw French green clay, active charcoal, and purifying tea tree oil.",
    price: 28.00,
    images: ["/cdn/products/mask-1.jpg"],
    category: "Treatment",
    stock: 70,
    isFeatured: false,
    isActive: true,
    benefits: ["Extracts deep-seated toxins"],
    ingredients: ["Raw French Montmorillonite Clay"],
    usage: "Leave on for 10-15 minutes until dry. Rinse."
  }
];

async function seed() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB!");

    // Clear collections & reset indexes
    console.log("Clearing old records and syncing collection schemas...");
    await Product.deleteMany({});
    await Bundle.deleteMany({});
    await User.deleteMany({});
    
    await Product.syncIndexes();
    await Bundle.syncIndexes();
    await User.syncIndexes();

    // Seed Users
    console.log("Creating default users...");
    const adminPasswordRaw = process.env.ADMIN_SEED_PASSWORD || "adminpassword123";
    const userPasswordRaw = process.env.USER_SEED_PASSWORD || "userpassword123";

    const adminPasswordHash = await bcrypt.hash(adminPasswordRaw, 10);
    const userPasswordHash = await bcrypt.hash(userPasswordRaw, 10);

    const adminEmail = process.env.ADMIN_EMAIL || "admin@iykevisualsdev.me";
    const adminUser = await User.create({
      name: "Naturalist Admin",
      email: adminEmail,
      password: adminPasswordHash,
      role: "admin",
      isVerified: true,
    });
    console.log(`Admin account ready: ${adminUser.email}`);

    const regularUser = await User.create({
      name: "Jane Doe",
      email: "jane.doe@gmail.com",
      password: userPasswordHash,
      role: "user",
      isVerified: true,
    });
    console.log(`Demo user account ready: ${regularUser.email}`);

    // Seed Products concurrently
    console.log("Creating products...");
    const productPromises = productsData.map((p) => {
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      return Product.create({ ...p, slug });
    });
    
    const createdProducts = await Promise.all(productPromises);
    createdProducts.forEach(product => console.log(`Product created: ${product.name}`));

    // Seed Bundles
    console.log("Creating bundles...");
    const glowRitual = await Bundle.create({
      name: "The Complete Glow Ritual",
      slug: "the-complete-glow-ritual",
      description: "Our signature 3-step ritual to cleanse, mist, and target skin dullness.",
      price: 76.00,
      compareAtPrice: 90.00,
      images: ["/cdn/bundles/bundle-glow.jpg"],
      products: [
        createdProducts[0]._id, // Cleanser
        createdProducts[2]._id, // Toner
        createdProducts[1]._id  // Serum
      ],
      isActive: true,
      isFeatured: true
    });
    console.log(`Bundle created: ${glowRitual.name}`);

    const hydrationDuo = await Bundle.create({
      name: "Deep Hydration Duo",
      slug: "deep-hydration-duo",
      description: "Formulated specifically for dry or mature skin.",
      price: 45.00,
      compareAtPrice: 54.00,
      images: ["/cdn/bundles/bundle-hydration.jpg"],
      products: [
        createdProducts[2]._id, // Toner
        createdProducts[3]._id  // Moisturizer
      ],
      isActive: true,
      isFeatured: false
    });
    console.log(`Bundle created: ${hydrationDuo.name}`);

    console.log("Database seeded successfully! 🎉");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected cleanly from MongoDB.");
    process.exit(0);
  }
}

seed();