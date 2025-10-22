// controllers/authController.js
import dotenv from "dotenv";
import UserServices from "../services/UserServices.js";

dotenv.config();



// ---------------------- LOGIN CONTROLLER ----------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const loginUser = await UserServices.login(email, password);

    if (!loginUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: loginUser, // exclude sensitive fields like password in service
    });
  } catch (err) {
    console.error("Login controller error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



export default { login };
