const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.id,
        role: decoded.role
      };

      if (req.user.role !== "Doctor") {
        return res.status(403).json({
          message: "Access denied. Only doctors can access this route."
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        message: "Not authorized, token failed or expired"
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token provided"
    });
  }
};

module.exports = { protect };