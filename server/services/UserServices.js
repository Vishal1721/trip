// services/UserServices.js
import User from "../models/User.js";
import bcrypt from "bcrypt";

const login = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const { password: _, ...userData } = user.toObject();
    return userData;
  } catch (err) {
    console.error("UserServices login error:", err);
    throw err;
  }
};

export default { login };
