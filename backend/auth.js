// Authentication Middleware
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "918cfb63fffbbc45a16b96beb5fca0deb9a33f0b2180997cc2f15b2affeab1e393c1630e3e9cb02aaf3fe5ae64fbaad1e5c03df2bbe29ca4ba9792c5c1f7ad0a";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

export default authenticateToken;
