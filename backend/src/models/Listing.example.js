import mongoose from "mongoose";
const ListingSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  description: String,
  price: Number,
  currency: { type: String, default: "THB" },
  category: String,
  condition: { type: String, default: "used" },
  media: [String],
  location: { province: String, amphoe: String, tambon: String, lat: Number, lng: Number },
  status: { type: String, default: "active" }
}, { timestamps: true });
export default mongoose.model("Listing", ListingSchema);
