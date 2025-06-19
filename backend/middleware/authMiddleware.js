import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // getting token from cookies
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // necessary to roceed to the next route handler
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
};
