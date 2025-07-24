const User = require('../models/User');

// Role-based authorization middleware
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = allowedRoles.map(role => role.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Resource ownership verification middleware
const authorizeResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userRole = req.user.role.toLowerCase();
      
      // Admin has access to everything
      if (userRole === 'admin') {
        return next();
      }

      // For other users, check resource access
      const userId = req.user.id;
      const targetUserId = req.params.id;

      switch (resourceType) {
        case 'user-profile':
          // Users can only access/modify their own profile, admins can access any
          if (userId !== targetUserId) {
            return res.status(403).json({ 
              message: 'Access denied. You can only access your own profile.' 
            });
          }
          break;

        case 'user-management':
          // Only admins can manage other users
          return res.status(403).json({ 
            message: 'Access denied. Only administrators can manage users.' 
          });

        case 'class-assignment':
          // Only admins can assign/unassign classes to teachers
          if (userRole !== 'admin') {
            return res.status(403).json({ 
              message: 'Access denied. Only administrators can manage class assignments.' 
            });
          }
          break;

        case 'student-assignment':
          // Only admins can assign/unassign students to therapists
          if (userRole !== 'admin') {
            return res.status(403).json({ 
              message: 'Access denied. Only administrators can manage student assignments.' 
            });
          }
          break;

        default:
          return res.status(500).json({ message: 'Unknown resource type' });
      }

      next();
    } catch (error) {
      console.error('Error in resource authorization:', error);
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

// Middleware to verify user can access specific students/classes based on assignments
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

      // Get user's assignments
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Store user assignments in req for use in route handlers
      req.userAssignments = {
        classes: user.classes || [],
        students: user.students || [],
        role: userRole
      };

      next();
    } catch (error) {
      console.error('Error in data access authorization:', error);
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

module.exports = {
  authorizeRoles,
  authorizeResourceAccess,
  authorizeDataAccess
};
