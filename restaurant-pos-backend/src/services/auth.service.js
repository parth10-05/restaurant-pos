import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { config } from '../config/env.js';

const SALT_ROUNDS = 12;
const VALID_ROLES = ['admin', 'cashier', 'kitchen'];

export const authService = {
  async signup({ email, password, role }) {
    // Validate role
    if (!VALID_ROLES.includes(role)) {
      const error = new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    return { message: 'User created successfully' };
  },

  async login({ email, password }) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      const err = new Error('Invalid or expired token');
      err.statusCode = 401;
      throw err;
    }
  },

  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  },
};