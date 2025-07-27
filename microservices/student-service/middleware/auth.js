const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid or expired token' });
      req.user = user; // user.id and user.role from payload
      next();
    });
  } else {
    res.status(401).json({ message: 'No token provided' });
  }
}

// Role-based authorization middleware
function authorizeRole(roles) { 
  console.log("authorizeRole middleware called with roles:", roles);
  return (req, res, next) => {
    if (
      !req.user ||
      !roles.map(r => r.toLowerCase()).includes(req.user.role.toLowerCase())
    ) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

// Enhanced data access authorization for students/classes
const authorizeDataAccess = (dataType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userRole = req.user.role.toLowerCase();
      
      // Admin has access to all data
      if (userRole === 'admin') {
        return next();
      }

      // For teachers and therapists, we'll need to fetch their assignments
      // This will be used by route handlers to filter data appropriately
      req.userRole = userRole;
      req.userId = req.user.id;

      next();
    } catch (error) {
      console.error('Error in data access authorization:', error);
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

module.exports = { authenticateJWT, authorizeRole, authorizeDataAccess };
