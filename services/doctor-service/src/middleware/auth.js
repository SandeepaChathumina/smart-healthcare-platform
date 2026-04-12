const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        role: decoded.role,
      };
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed or expired" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token provided" });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Required role: ${roles.join(" or ")}` });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };