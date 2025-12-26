// Seed sample users & listings (adjust to your actual models)
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../src/config/db.js";
import mongoose from "mongoose";

// Rename these imports to your real model paths if different
import User from "../src/models/User.example.js";
import Listing from "../src/models/Listing.example.js";

function rand(arr){ return arr[Math.floor(Math.random()*arr.length)] }
async function run(){
  await connectDB(process.env.MONGO_URI);

  // wipe sample collections (WARNING)
  await Promise.all([User.deleteMany({}), Listing.deleteMany({})]);

  const users = await User.insertMany([
    { name: "Seller One", email: "seller1@example.com", password: "hashed", role: "user" },
    { name: "Buyer One",  email: "buyer1@example.com",  password: "hashed", role: "user" }
  ]);

  const categories = ["Phones","Electronics","Fashion"];
  const provinces = ["กรุงเทพมหานคร","ขอนแก่น","สุรินทร์","เชียงใหม่"];
  const conds = ["used","like-new","new"];

  const listings = [];
  for (let i=0;i<8;i++){
    listings.push({
      sellerId: users[0]._id,
      title: `Item #${i+1}`,
      description: "Sample listing",
      price: 500 + i*100,
      category: rand(categories),
      condition: rand(conds),
      location: { province: rand(provinces) },
      media: []
    });
  }
  await Listing.insertMany(listings);

  console.log("Seeded:", { users: users.length, listings: listings.length });
  await mongoose.disconnect();
}
run().catch(e=>{ console.error(e); process.exit(1); });
