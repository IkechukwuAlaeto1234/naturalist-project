import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define MONGODB_URI in your .env.local file");
  process.exit(1);
}

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

const BlogSectionSchema = new mongoose.Schema(
  {
    heading: { type: String },
    body: { type: String, required: true },
    image: { type: String },
    imageAlt: { type: String },
  },
  { _id: false }
);

const BlogCommentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    coverImage: { type: String, required: true },
    coverImageAlt: { type: String },
    authorName: { type: String, required: true },
    authorRole: { type: String },
    publishedAt: { type: Date, required: true, default: Date.now },
    readTime: { type: String, required: true },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    sections: { type: [BlogSectionSchema], default: [] },
    comments: { type: [BlogCommentSchema], default: [] },
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
const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const productsData = [
  {
    name: "Clarifying Sage Facial Cleanser",
    description: "A purifying, non-stripping facial cleanser infused with white sage, cucumber extract, and soothing aloe vera.",
    price: 24,
    compareAtPrice: 28,
    images: ["/cdn/products/cleanser-1.jpg"],
    category: "Cleanser",
    stock: 120,
    isFeatured: true,
    isActive: true,
    benefits: ["Deeply cleanses pores", "Controls excess oil", "Calms redness"],
    ingredients: ["Organic White Sage Extract", "Fresh Cucumber Distillate"],
    usage: "Massage onto damp face. Rinse thoroughly.",
  },
  {
    name: "Botanical Bakuchiol Glow Serum",
    description: "An exceptional plant-based retinoid alternative that targets fine lines, uneven tone, and dark spots.",
    price: 48,
    compareAtPrice: 55,
    images: ["/cdn/products/serum-1.jpg"],
    category: "Serum",
    stock: 85,
    isFeatured: true,
    isActive: true,
    benefits: ["Reduces fine lines", "Promotes cell turnover"],
    ingredients: ["2% Pure Bakuchiol", "Hyaluronic Acid"],
    usage: "Apply 3-4 drops to clean skin.",
  },
  {
    name: "Rosewater Hydra-Mist Tonique",
    description: "A revitalizing facial mist distilled from organic Damask rose petals, organic green tea, and calming witch hazel.",
    price: 18,
    images: ["/cdn/products/toner-1.jpg"],
    category: "Toner",
    stock: 150,
    isFeatured: false,
    isActive: true,
    benefits: ["Instantly hydrates", "Restores optimal pH"],
    ingredients: ["100% Organic Damask Rose Hydrosol"],
    usage: "Mist generously over clean face.",
  },
  {
    name: "Nourishing Avocado & Seaweed Cream",
    description: "A decadent, moisture-rich facial cream packed with cold-pressed avocado oil and nutrient-dense organic kelp extract.",
    price: 36,
    compareAtPrice: 42,
    images: ["/cdn/products/cream-1.jpg"],
    category: "Moisturizer",
    stock: 95,
    isFeatured: true,
    isActive: true,
    benefits: ["Intense moisture barrier support"],
    ingredients: ["Cold-Pressed Organic Avocado Oil"],
    usage: "Warm a pea-sized amount and pat onto face.",
  },
  {
    name: "French Green Clay Detox Mask",
    description: "An intensive clarifying treatment made with raw French green clay, active charcoal, and purifying tea tree oil.",
    price: 28,
    images: ["/cdn/products/mask-1.jpg"],
    category: "Treatment",
    stock: 70,
    isFeatured: false,
    isActive: true,
    benefits: ["Extracts deep-seated toxins"],
    ingredients: ["Raw French Montmorillonite Clay"],
    usage: "Leave on for 10-15 minutes until dry. Rinse.",
  },
];

const blogPostsData = [
  {
    title: "How to Build a Botanical Routine That Actually Sticks",
    slug: "build-a-botanical-routine-that-sticks",
    excerpt: "The best skincare routines are the ones you can live with every day. Here is how to keep it simple, effective, and consistent.",
    coverImage: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=1400&q=80",
    coverImageAlt: "Naturalist botanical skincare routine on a calm surface",
    authorName: "Miracle Odinakachukwu",
    authorRole: "Naturalist Editorial Writer",
    publishedAt: new Date(),
    readTime: "5 min read",
    tags: ["Routine", "Skin Health", "Guides"],
    featured: true,
    sections: [
      { heading: "Start with the basics", body: "Most routines fail because they are too ambitious. A cleanser, a treatment, and a moisturizer are enough for most people. The rest should be added only when the skin is already stable." },
      { heading: "Texture matters", body: "If a routine feels heavy or confusing, people stop using it. Keep your products airy, layer them in a simple order, and make sure each step feels like a small ritual rather than a chore.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80", imageAlt: "Calm botanical skincare flat lay" },
      { heading: "Commit for 30 days", body: "A month is enough time to see whether the routine is helping. Track changes in clarity, hydration, and texture before changing products again." },
    ],
    comments: [{ name: "Ada", message: "This is the most realistic routine advice I have read in a while.", createdAt: new Date() }],
  },
  {
    title: "Why Bakuchiol Deserves a Place in a Gentle Night Routine",
    slug: "why-bakuchiol-belongs-in-night-routine",
    excerpt: "Bakuchiol is not a trend piece. It is a practical ingredient for people who want a smoother skin tone without irritation.",
    coverImage: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=80",
    coverImageAlt: "Bakuchiol bottle with soft natural lighting",
    authorName: "Naturalist Team",
    authorRole: "Editorial Desk",
    publishedAt: new Date(),
    readTime: "4 min read",
    tags: ["Ingredients", "Bakuchiol", "Night Care"],
    featured: false,
    sections: [
      { heading: "What it does", body: "Bakuchiol supports a smoother-looking complexion and pairs well with calmer routines. It is a good fit for people who want more consistency and less drama." },
      { heading: "How to use it", body: "Apply it at night after cleansing and before moisturizer. Keep the rest of the routine simple so the ingredient can do its work without competing with too many actives.", image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1400&q=80", imageAlt: "Minimal skincare bottle against warm light" },
    ],
    comments: [],
  },
  {
    title: "The Soft Power of a Cleanser You Can Trust",
    slug: "soft-power-of-a-cleanser-you-can-trust",
    excerpt: "A cleanser should do one job well: remove the day without stripping the skin. Everything else is secondary.",
    coverImage: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1400&q=80",
    coverImageAlt: "Minimal botanical cleanser bottle on light background",
    authorName: "Miracle Odinakachukwu",
    authorRole: "Naturalist Editorial Writer",
    publishedAt: new Date(),
    readTime: "6 min read",
    tags: ["Cleanser", "Rituals", "Basics"],
    featured: false,
    sections: [
      { heading: "Do not overcomplicate the wash step", body: "When the cleanser is too strong, every other product starts fighting the skin. A gentle cleanser sets up the rest of the ritual for success." },
      { heading: "The right cleanser feels calm", body: "A good cleanser leaves the skin balanced and ready, not squeaky or tight. That is the difference between a quick wash and a proper ritual.", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1400&q=80", imageAlt: "Soft skincare bottle with leaves" },
    ],
    comments: [{ name: "Bayo", message: "This one made me rethink every cleanser I have used before.", createdAt: new Date() }],
  },
];

async function seed() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB!");

    console.log("Clearing old records and syncing collection schemas...");
    await Product.deleteMany({});
    await Bundle.deleteMany({});
    await Blog.deleteMany({});
    await User.deleteMany({});

    await Product.syncIndexes();
    await Bundle.syncIndexes();
    await Blog.syncIndexes();
    await User.syncIndexes();

    console.log("Creating default users...");
    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || "adminpassword123", 10);
    const userPasswordHash = await bcrypt.hash(process.env.USER_SEED_PASSWORD || "userpassword123", 10);

    const adminUser = await User.create({
      name: "Naturalist Admin",
      email: process.env.ADMIN_EMAIL || "admin@iykevisualsdev.me",
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

    console.log("Creating products...");
    const createdProducts = await Promise.all(
      productsData.map((product) => {
        const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
        return Product.create({ ...product, slug });
      })
    );
    createdProducts.forEach((product) => console.log(`Product created: ${product.name}`));

    console.log("Creating bundles...");
    const glowRitual = await Bundle.create({
      name: "The Complete Glow Ritual",
      slug: "the-complete-glow-ritual",
      description: "Our signature 3-step ritual to cleanse, mist, and target skin dullness.",
      price: 76,
      compareAtPrice: 90,
      images: ["/cdn/bundles/bundle-glow.jpg"],
      products: [createdProducts[0]._id, createdProducts[2]._id, createdProducts[1]._id],
      isActive: true,
      isFeatured: true,
    });
    console.log(`Bundle created: ${glowRitual.name}`);

    const hydrationDuo = await Bundle.create({
      name: "Deep Hydration Duo",
      slug: "deep-hydration-duo",
      description: "Formulated specifically for dry or mature skin.",
      price: 45,
      compareAtPrice: 54,
      images: ["/cdn/bundles/bundle-hydration.jpg"],
      products: [createdProducts[2]._id, createdProducts[3]._id],
      isActive: true,
      isFeatured: false,
    });
    console.log(`Bundle created: ${hydrationDuo.name}`);

    console.log("Creating blog posts...");
    for (const post of blogPostsData) {
      const created = await Blog.create(post);
      console.log(`Blog post created: ${created.title}`);
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected cleanly from MongoDB.");
    process.exit(0);
  }
}

seed();