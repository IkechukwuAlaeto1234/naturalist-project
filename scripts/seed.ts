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

const ContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", trim: true },
    images: { type: [String], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    versions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Bundle = mongoose.models.Bundle || mongoose.model("Bundle", BundleSchema);
const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Content = mongoose.models.Content || mongoose.model("Content", ContentSchema);


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
    await Content.deleteMany({});

    await Product.syncIndexes();
    await Bundle.syncIndexes();
    await Blog.syncIndexes();
    await User.syncIndexes();
    await Content.syncIndexes();

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

    console.log("Creating default page content records...");
    const defaultContents = [
      {
        key: "home",
        title: "Home Page Content",
        metadata: {
          heroBadge: "The Skin Ritual Revolution",
          heroHeadline: "Pure Botanicals.\nModern Efficacy.",
          heroSubtext: "Formulated with high-efficacy, wild-harvested white sage, bakuchiol, and organic seaweed to unleash your skin's natural radiance.",
          heroPrimaryCta: "Shop All Rituals",
          heroSecondaryCta: "Our Botanical Ethos",
          heroImage: "/cdn/image/upload/v1780528756/naturalist/pages/kbijaiehbkyygbashfrw.jpg",
          sectionBadge: "Formulation Ethos",
          sectionHeadline: "The Naturalist Standard",
          sectionSubtext: "Experience organic beauty crafted with absolute precision. High efficacy meets planet-first preservation.",
          feature1Title: "Wild-Harvested",
          feature1Body: "Distilled entirely from organic, raw botanicals sourced responsibly from their native habitats.",
          feature2Title: "Clinical Efficacy",
          feature2Body: "Scientific concentrations of active botanical acids designed to nourish and regenerate skin cells.",
          feature3Title: "Total Transparency",
          feature3Body: "Every single batch undergoes rigorous dermatological checks. 100% vegan, clean, and cruelty-free.",
          feature4Title: "Eco-Conscious Packaging",
          feature4Body: "Presented exclusively in recyclable glass bottles and organic wood caps. Never any single-use plastics.",
          philosophyBadge: "Our Commitment",
          philosophyHeadline: "Nourish Your Body.\nRespect Our Planet.",
          philosophyQuote: "We believe that beauty is formed through pure, natural balance. That's why we source our white sage, aloe, and seaweed from local wild farms, utilizing zero-waste packaging to ensure your beauty ritual is perfectly in harmony with nature.",
          philosophyAttribution: "The Naturalist Ethos",
          philosophyImage: ""
        }
      },
      {
        key: "shop",
        title: "Shop Page Content",
        metadata: {
          heroBadge: "Our Collection",
          heroHeadline: "The Shop",
          heroSubtext: "Every formula, every ritual — crafted from wild-harvested botanicals.",
          heroImage: "",
          emptyStateTitle: "Garden Under Cultivation",
          emptyStateBody: "No products match your current filter. Our active botanical formulas are currently being freshly distilled and prepared."
        }
      },
      {
        key: "bundles",
        title: "Ritual Bundles Page Content",
        metadata: {
          heroBadge: "Curated Sets",
          heroHeadline: "Ritual Bundles",
          heroSubtext: "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy.",
          heroImage: ""
        }
      },
      {
        key: "story",
        title: "Our Story Page Content",
        metadata: {
          heroBadge: "The Naturalist Origin",
          heroHeadline: "Our Story",
          heroSubtext: "Built on the belief that pure is powerful — and that skin deserves honesty.",
          heroImage: "",
          openingQuote: "We started because we couldn't find a single skincare brand that told us the whole truth.",
          openingAttribution: "— Founders, Naturalist",
          openingBody: "Every bottle on the market had a story — an aspirational pastoral image, a celebrity endorsement, a word like \"natural\" printed next to an ingredient list that read like a chemistry exam. We decided to build something different: a brand where the ingredient list is the whole point, and every botanical has a traceable origin.",
          openingImage: "",
          timelineSectionBadge: "How We Got Here",
          timelineSectionHeadline: "Five Years, One Standard",
          milestones: [
            {
              year: "2018",
              title: "The Seed",
              body: "Founded in a small home kitchen in Portland, Naturalist began as one person's frustration with toxic ingredient lists. The first formula — a white sage facial oil — was made in batches of twelve."
            },
            {
              year: "2020",
              title: "First Harvest Partnership",
              body: "We established our first direct partnership with a certified organic white sage farm in Southern California, locking in our wild-harvesting ethics and supply chain integrity."
            },
            {
              year: "2021",
              title: "Bakuchiol Breakthrough",
              body: "Our signature Bakuchiol Serum launched and sold out within 72 hours. It put Naturalist on the map as a serious alternative to synthetic retinol — without a single irritant."
            },
            {
              year: "2023",
              title: "Zero Waste Certified",
              body: "We completed our transition to 100% recyclable glass and organic wood packaging, eliminating the last traces of single-use plastic from our entire supply chain."
            },
            {
              year: "2025",
              title: "Today",
              body: "Naturalist now serves over 80,000 customers across 40 countries. Every formula is still made in small batches, third-party tested, and built around the same founding principle: pure is powerful."
            }
          ],
          valuesSectionBadge: "What Drives Us",
          valuesSectionHeadline: "Our Founding Principles",
          values: [
            {
              label: "Radical Transparency",
              body: "Every ingredient, every supplier, every test result — available on request. No proprietary blend smokescreens. No hidden fillers."
            },
            {
              label: "Wild-Harvested Only",
              body: "We never use lab-synthesized substitutes where a living plant exists. Our botanicals come directly from organic farms and certified wild-harvest cooperatives."
            },
            {
              label: "Small Batch Always",
              body: "Mass production compromises freshness and potency. Every Naturalist formula is made in controlled small batches and tested before it ships."
            },
            {
              label: "Planet-First Packaging",
              body: "Glass. Wood. Recycled paper. Nothing that outlives a human lifespan in a landfill. We absorbed the cost increase ourselves — not passed to you."
            }
          ],
          ctaBadge: "Ready to Begin?",
          ctaHeadline: "Experience the Ritual.",
          ctaSubtext: "Every product is an extension of this story. Small batch. Third-party tested. Botanically honest.",
          ctaImage: ""
        }
      },
      {
        key: "sustainability",
        title: "Sustainability Page Content",
        metadata: {
          heroBadge: "Planet First",
          heroHeadline: "Sustainability",
          heroSubtext: "Our pledge to the planet that grows our ingredients and the communities that harvest them.",
          heroImage: "",
          pillarsSectionBadge: "Our Commitments",
          pillarsSectionHeadline: "Four Pillars of Responsibility",
          pillars: [
            {
              title: "Wild-Harvested Sourcing",
              body: "Every botanical ingredient is sourced from certified organic farms or licensed wild-harvest cooperatives. We conduct annual audits of every supplier in our chain — no exceptions."
            },
            {
              title: "Zero-Waste Packaging",
              body: "100% of our packaging is recyclable glass, organic wood, or FSC-certified recycled paper. We eliminated the last single-use plastic component from our supply chain in 2023."
            },
            {
              title: "Water Responsibility",
              body: "Our manufacturing facilities use closed-loop water systems that recycle over 92% of process water. We also offset 100% of our remaining water usage through WaterAid partnerships."
            },
            {
              title: "Carbon Neutral Operations",
              body: "All Naturalist facilities run on 100% renewable energy. Our logistics are carbon-offset through verified reforestation projects in sub-Saharan Africa and Southeast Asia."
            }
          ],
          stat1Value: "100%",
          stat1Label: "Organic Botanicals",
          stat2Value: "0",
          stat2Label: "Single-Use Plastics",
          stat3Value: "92%",
          stat3Label: "Water Recycled",
          stat4Value: "40+",
          stat4Label: "Countries Served",
          ctaSectionBadge: "Customer Care",
          ctaHeadline: "Questions about returns?",
          ctaSubtext: "We stand behind every formula. If it doesn't work for you, we make it right — no questions asked."
        }
      },
      {
        key: "blog",
        title: "Blog Page Content",
        metadata: {
          heroBadge: "Rituals & Stories",
          heroHeadline: "Our Journal",
          heroSubtext: "Fresh editorial notes from the Naturalist team. Thoughtful ingredients, practical rituals, and a calm reading experience.",
          heroImage: "",
          emptyStateText: "No blog posts have been published yet."
        }
      },
      {
        key: "privacy-policy",
        title: "Privacy Policy",
        metadata: {
          effectiveDate: "May 31, 2026",
          title: "Privacy Policy",
          subtitle: "How we collect, use, and protect your personal information.",
          sections: [
            {
              heading: "1. Introduction",
              body: "Naturalist ('we', 'us', or 'our') is committed to protecting your personal information. This Privacy Policy explains what data we collect when you use our website (naturalist.com), how we use it, who we share it with, and the choices you have. By using our site, you agree to the terms described here."
            },
            {
              heading: "2. Information We Collect",
              body: [
                "Account information: name, email address, and password when you create an account.",
                "Order information: billing address, shipping address, payment method (processed via secure third-party providers — we never store full card numbers), and order history.",
                "Usage data: pages visited, products viewed, search queries, browser type, device type, and IP address.",
                "Communications: messages you send us via our contact form or email.",
                "Newsletter subscriptions: email address and subscription preferences."
              ]
            },
            {
              heading: "3. How We Use Your Information",
              body: [
                "To process and fulfil your orders, including shipping confirmation and order status updates.",
                "To create and manage your account.",
                "To send transactional emails (order confirmations, shipping updates, password resets).",
                "To send marketing emails, only if you have opted in. You may unsubscribe at any time.",
                "To improve our website, product range, and customer experience through analytics.",
                "To comply with legal obligations, including tax and fraud prevention requirements."
              ]
            },
            {
              heading: "4. Cookies & Tracking",
              body: "We use cookies and similar tracking technologies to operate our website, remember your preferences, and measure performance. You can manage your cookie preferences at any time via our Cookie Policy page or your browser settings. Disabling certain cookies may affect site functionality."
            },
            {
              heading: "5. Data Sharing",
              body: "We do not sell your personal data. We share information only with trusted service providers who help us operate our business — such as payment processors, shipping carriers, and email service providers — and only to the extent necessary to perform those services. These providers are contractually obligated to protect your data."
            },
            {
              heading: "6. Data Retention",
              body: "We retain your personal data for as long as your account is active or as needed to fulfil the purposes described in this policy. Order records are retained for seven years to comply with tax obligations. You may request deletion of your account at any time."
            },
            {
              heading: "7. Your Rights",
              body: [
                "Access: request a copy of the personal data we hold about you.",
                "Correction: request that we update inaccurate or incomplete data.",
                "Deletion: request that we delete your personal data, subject to legal obligations.",
                "Portability: request your data in a structured, machine-readable format.",
                "Objection: object to processing based on legitimate interests or for direct marketing.",
                "Withdraw consent: unsubscribe from marketing emails at any time using the link in any email."
              ]
            },
            {
              heading: "8. Security",
              body: "We use industry-standard security measures including TLS encryption, secure servers, and access controls to protect your data. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security, but we take every reasonable precaution."
            },
            {
              heading: "9. Children's Privacy",
              body: "Our website is not directed at children under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately and we will delete it."
            },
            {
              heading: "10. Changes to This Policy",
              body: "We may update this Privacy Policy from time to time. When we do, we will revise the 'last updated' date at the top of this page. Material changes will be notified via email to registered customers."
            },
            {
              heading: "11. Contact",
              body: "For any questions or requests relating to this Privacy Policy, please contact our team at hello@naturalist.com or via the contact form on our website."
            }
          ]
        }
      },
      {
        key: "terms",
        title: "Terms of Service",
        metadata: {
          effectiveDate: "May 31, 2026",
          title: "Terms of Service",
          subtitle: "The rules and guidelines that govern your use of Naturalist.",
          sections: [
            {
              heading: "1. Acceptance of Terms",
              body: "By accessing or using the Naturalist website (naturalist.com) or placing an order, you agree to be bound by these Terms of Service. If you do not agree, please do not use our site. We reserve the right to update these terms at any time; continued use constitutes acceptance of any changes."
            },
            {
              heading: "2. Eligibility",
              body: "You must be at least 18 years of age to place an order or create an account on naturalist.com. By using this site, you represent and warrant that you meet this age requirement."
            },
            {
              heading: "3. Products & Availability",
              body: [
                "All product descriptions, images, and prices are subject to change without notice.",
                "We reserve the right to limit quantities, refuse orders, or discontinue products at any time.",
                "Colours and textures may appear slightly different on screen due to monitor calibration.",
                "Product availability is not guaranteed until your order is confirmed."
              ]
            },
            {
              heading: "4. Pricing & Payment",
              body: "Prices are listed in USD and are inclusive of applicable taxes where stated. We accept major credit cards, debit cards, and other payment methods displayed at checkout. Payment is processed securely via third-party providers. We reserve the right to cancel any order placed at an incorrectly displayed price."
            },
            {
              heading: "5. Orders & Cancellations",
              body: "Once an order is placed, you have a 2-hour window to modify or cancel it. After that window, fulfilment may have commenced. Contact us immediately at hello@naturalist.com if you need to make changes. We reserve the right to cancel any order at our discretion, in which case a full refund will be issued."
            },
            {
              heading: "6. Shipping",
              body: "Delivery timelines are estimates and not guarantees. Naturalist is not responsible for delays caused by carriers, customs processing, or circumstances beyond our control. Risk of loss and title for products purchased pass to you upon delivery to the carrier."
            },
            {
              heading: "7. Returns & Refunds",
              body: "Returns and refunds are governed by our Refund Policy, which is incorporated into these terms by reference. Please review that policy before placing an order."
            },
            {
              heading: "8. Intellectual Property",
              body: "All content on naturalist.com — including text, images, logos, product designs, and code — is the property of Naturalist or its licensors and is protected by copyright and trademark law. You may not reproduce, distribute, or create derivative works without prior written permission."
            },
            {
              heading: "9. User Accounts",
              body: [
                "You are responsible for maintaining the confidentiality of your account credentials.",
                "You agree to notify us immediately of any unauthorised use of your account.",
                "We reserve the right to suspend or terminate accounts that violate these terms."
              ]
            },
            {
              heading: "10. Prohibited Conduct",
              body: [
                "Using the site for any unlawful purpose or in violation of any applicable regulations.",
                "Attempting to gain unauthorised access to any part of our systems.",
                "Submitting false, misleading, or fraudulent information.",
                "Reselling products purchased from Naturalist without prior written consent."
              ]
            },
            {
              heading: "11. Disclaimer of Warranties",
              body: "Our website and products are provided on an 'as is' basis. We make no warranties, express or implied, regarding the accuracy, completeness, or fitness for a particular purpose of any content or product. Our skincare products are not intended to diagnose, treat, cure, or prevent any medical condition."
            },
            {
              heading: "12. Limitation of Liability",
              body: "To the maximum extent permitted by law, Naturalist shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products. Our total liability shall not exceed the amount paid by you for the specific order giving rise to the claim."
            },
            {
              heading: "13. Governing Law",
              body: "These Terms of Service are governed by the laws of the State of Oregon, USA, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the courts of Multnomah County, Oregon."
            },
            {
              heading: "14. Contact",
              body: "Questions about these Terms? Reach us at hello@naturalist.com or via our contact form."
            }
          ]
        }
      },
      {
        key: "cookie-policy",
        title: "Cookie Policy",
        metadata: {
          effectiveDate: "May 31, 2026",
          title: "Cookie Policy",
          subtitle: "How we use cookies to improve your experience on our website.",
          sections: [
            {
              heading: "1. What Are Cookies",
              body: "Cookies are small text files placed on your device when you visit a website. They allow the site to remember your actions and preferences over a period of time, so you don't have to re-enter information each visit. Cookies do not contain personally identifiable information on their own, but may be linked to it."
            },
            {
              heading: "2. Cookies We Use",
              body: [
                "Essential cookies: required for the website to function. These enable login sessions, shopping cart persistence, and security features. They cannot be disabled.",
                "Performance cookies: collect anonymous information about how visitors use our site, such as which pages are visited most. We use this data to improve the site experience.",
                "Functionality cookies: remember your preferences such as dark mode, currency, and language settings.",
                "Analytics cookies: provided by third-party services (such as Google Analytics) to help us understand traffic sources and user behaviour in aggregate.",
                "Marketing cookies: used to deliver relevant advertisements and track campaign effectiveness. These are only active if you have given consent."
              ]
            },
            {
              heading: "3. Third-Party Cookies",
              body: "Some cookies on our site are placed by third-party services we use, including payment processors, analytics providers, and social media platforms. We do not control these third-party cookies; their use is governed by the respective providers' privacy and cookie policies."
            },
            {
              heading: "4. Your Cookie Choices",
              body: "When you first visit our website, you will be presented with a cookie consent banner. You may accept all cookies, reject non-essential cookies, or manage your preferences individually. You can change your preferences at any time by clearing your cookies and revisiting the site, or by adjusting your browser settings."
            },
            {
              heading: "5. Managing Cookies in Your Browser",
              body: [
                "Chrome: Settings → Privacy and Security → Cookies and other site data.",
                "Firefox: Settings → Privacy & Security → Cookies and Site Data.",
                "Safari: Preferences → Privacy → Manage Website Data.",
                "Edge: Settings → Cookies and site permissions → Cookies and site data.",
                "Note: disabling essential cookies will impair core site functionality including checkout."
              ]
            },
            {
              heading: "6. Do Not Track",
              body: "Some browsers include a 'Do Not Track' (DNT) signal. Our website does not currently alter its behaviour based on DNT signals, as there is no universal standard for interpreting them. We aim to provide clear opt-out controls directly on our site."
            },
            {
              heading: "7. Retention",
              body: "Session cookies expire when you close your browser. Persistent cookies remain for a defined period — typically between 30 days and 2 years depending on their purpose. You can delete all cookies at any time via your browser settings."
            },
            {
              heading: "8. Updates to This Policy",
              body: "We may update this Cookie Policy to reflect changes in technology, regulation, or our own practices. When we do, we will update the 'last updated' date. We encourage you to review this policy periodically."
            },
            {
              heading: "9. Contact",
              body: "For questions about our use of cookies, please email us at hello@naturalist.com or use our contact form."
            }
          ]
        }
      },
      {
        key: "refund-policy",
        title: "Refund Policy",
        metadata: {
          effectiveDate: "May 31, 2026",
          title: "Refund Policy",
          subtitle: "Our return, exchange, and refund guarantees.",
          sections: [
            {
              heading: "1. 30-Day Satisfaction Guarantee",
              body: "If you're not completely satisfied with any Naturalist product, return it within 30 days of delivery for a full refund — no questions asked. The product must be at least 50% unused."
            },
            {
              heading: "2. How to Initiate a Return",
              body: "Log in to your account and navigate to 'My Orders'. Select the item you wish to return and follow the guided steps. A prepaid return label will be emailed to you within 24 hours."
            },
            {
              heading: "3. Refund Processing Time",
              body: "Once we receive your return, refunds are processed within 3–5 business days. The funds typically appear on your statement within 5–10 business days depending on your bank or card issuer."
            },
            {
              heading: "4. Damaged or Incorrect Orders",
              body: "If your order arrives damaged or incorrect, contact us at hello@naturalist.com within 7 days with a photo. We will dispatch a replacement at no cost within 2 business days."
            },
            {
              heading: "5. Non-Returnable Items",
              body: "For hygiene reasons, opened products that are more than 50% used cannot be returned. Gift cards and downloadable content are also non-refundable."
            },
            {
              heading: "6. International Returns",
              body: "International customers are responsible for return shipping costs unless the item is damaged or incorrect. Refunds are issued in the original currency of purchase."
            }
          ]
        }
      }
    ];

    for (const c of defaultContents) {
      await Content.create(c);
      console.log(`Content key "${c.key}" seeded.`);
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