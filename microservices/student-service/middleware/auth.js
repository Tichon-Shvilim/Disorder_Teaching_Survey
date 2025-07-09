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
module.exports = { authenticateJWT, authorizeRole };
