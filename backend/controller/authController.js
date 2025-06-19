import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import sendWelcomeEmail from "../utils/email.js";

// access token (first login)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
};

// refresh token (activated last min of acesstoken to get new acesstoken)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "120m" },
  );
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.isFirstLogin) {
      try {
        await sendWelcomeEmail();

        user.isFirstLogin = false;
        await user.save();
      } catch (emailError) {}
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send the refresh token as an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Send the response with the access token and user info
    res.json({
      message: "Login successful",
      token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error in login:", err);
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = generateAccessToken(decoded);

    res.json({ token: newAccessToken });
  } catch (err) {
    console.error("Error refreshing token:", err);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({
        message: "All fields (username, email, password) are required.",
      });
  }

  try {
    const newUser = await User.create({ username, email, password });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Error in signup:", err);
    res.status(500).json({ message: "Error signing up", error: err.message });
  }
};
