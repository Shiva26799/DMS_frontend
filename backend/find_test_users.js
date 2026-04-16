import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const findUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const roles = ["Super Admin", "Distributor", "Dealer"];
    for (const role of roles) {
      const user = await User.findOne({ role });
      if (user) {
        console.log(`Role: ${role} | Email: ${user.email}`);
      } else {
        console.log(`Role: ${role} | Not found`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findUsers();
