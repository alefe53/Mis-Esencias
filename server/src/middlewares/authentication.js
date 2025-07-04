// src/middlewares/authentication.js
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    req.user = { subscription_tier_id: 1 }; 
    return next();
  }

  jwt.verify(token, config.jwt.SECRET, (err, user) => {
    if (err) {
      console.warn('Token JWT inválido o expirado:', err.message);
      req.user = { subscription_tier_id: 1 };
      return next();
    }
    req.user = user;
    next();
  });
};