const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "No token provided. Please log in." 
      });
    }

    // Extract token more safely
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication token missing." 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User no longer exists." 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: "This account has been deactivated." 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Auth Error:", error.message);
    const message = error.name === 'TokenExpiredError' ? "Session expired" : "Unauthorized access";
    res.status(401).json({ success: false, message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Access restricted to [${roles.join(', ')}]` 
      });
    }
    next();
  };
};

module.exports = { auth, authorize };