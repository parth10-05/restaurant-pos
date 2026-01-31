import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { config } from '../config/env.js';

export const authController = {
  async signup(req, res, next) {
    try {
      const { email, password, role } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role || 'cashier',
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};