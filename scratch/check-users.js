const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  resetToken: String,
  resetTokenExpires: Date,
  isVerified: Boolean
}, { collection: "users" });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in .env.local");
    return;
  }
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.");
  
  try {
    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      console.log({
        id: u._id,
        name: u.name,
        email: u.email,
        isVerified: u.isVerified,
        resetToken: u.resetToken,
        resetTokenExpires: u.resetTokenExpires
      });
    }
  } catch (err) {
    console.error("Error querying users:", err);
  }
  
  await mongoose.disconnect();
}
run();
