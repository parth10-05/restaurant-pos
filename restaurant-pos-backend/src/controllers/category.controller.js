import { categoryService } from '../services/category.service.js';

export const categoryController = {
  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await categoryService.getAllCategories(includeInactive);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const category = await categoryService.deleteCategory(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },
};