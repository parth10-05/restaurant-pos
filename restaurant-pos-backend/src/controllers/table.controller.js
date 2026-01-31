import { tableService } from '../services/table.service.js';
import prisma from '../prisma/client.js';

export const tableController = {
  async getByFloor(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const tables = await tableService.getTablesByFloor(
        req.params.floorId,
        includeInactive
      );

      res.status(200).json({
        success: true,
        data: tables,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const table = await tableService.getTableById(req.params.id);

      res.status(200).json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  },

  async getActiveOrder(req, res, next) {
    try {
      const { id } = req.params;

      // Find any order for this table that is not paid
      const activeOrder = await prisma.order.findFirst({
        where: {
          tableId: id,
          status: {
            in: ['draft', 'sent_to_kitchen', 'completed'],
          },
        },
        include: {
          table: true,
          orderLines: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: activeOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const table = await tableService.createTable(req.params.floorId, req.body);

      res.status(201).json({
        success: true,
        message: 'Table created successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const table = await tableService.updateTable(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Table updated successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const table = await tableService.deleteTable(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Table deleted successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  },
};