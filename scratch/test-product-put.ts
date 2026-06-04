import dotenv from "dotenv";
import path from "path";

// Load local environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function run() {
  try {
    console.log("Loading module paths dynamically to avoid ESM hoisting...");
    const { connectToDatabase } = await import("../lib/db");
    const { Product } = await import("../models/Product");

    console.log("Connecting to Database via MONGODB_URI...");
    await connectToDatabase();
    console.log("Connected successfully!");

    const slug = "clarifying-sage-facial-cleanser";
    console.log(`Querying product slug: "${slug}"...`);
    const product = await Product.findOne({ slug });
    if (!product) {
      console.log("Product not found in the database. Creating one for testing...");
      const newProduct = await Product.create({
        name: "Clarifying Sage Facial Cleanser",
        slug: slug,
        description: "A premium clarifying facial cleanser with organic sage extracts.",
        price: 24.00,
        images: ["/cdn/clarifying-sage.jpg"],
        category: "Skincare",
        stock: 50,
      });
      console.log("Created test product:", newProduct.name);
      return;
    }

    console.log(`Found product: "${product.name}" (_id: ${product._id})`);
    
    // Simulate the exact PUT logic
    const originalName = product.name;
    const updateData = {
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: product.images,
      category: product.category,
      stock: product.stock,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    };

    console.log("Assigning fields...");
    product.name = updateData.name;
    product.description = updateData.description;
    product.price = updateData.price;
    product.compareAtPrice = updateData.compareAtPrice;
    product.images = updateData.images;
    product.category = updateData.category;
    product.stock = updateData.stock;
    product.isActive = updateData.isActive;
    product.isFeatured = updateData.isFeatured;

    console.log("Attempting product.save()...");
    await product.save();
    console.log("Success! Product saved cleanly without any errors.");
  } catch (error) {
    console.error("\n--- DATABASE TRANSACTION CRASH DETECTED ---");
    console.error(error);
    console.error("-------------------------------------------\n");
  } finally {
    process.exit(0);
  }
}

run();
