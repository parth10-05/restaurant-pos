import { floorService } from '../services/floor.service.js';

export const floorController = {
  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const floors = await floorService.getAllFloors(includeInactive);

      res.status(200).json({
        success: true,
        data: floors,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const floor = await floorService.getFloorById(req.params.id);

      res.status(200).json({
        success: true,
        data: floor,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const floor = await floorService.createFloor(req.body);

      res.status(201).json({
        success: true,
        message: 'Floor created successfully',
        data: floor,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const floor = await floorService.updateFloor(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Floor updated successfully',
        data: floor,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const floor = await floorService.deleteFloor(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Floor deleted successfully',
        data: floor,
      });
    } catch (error) {
      next(error);
    }
  },
};