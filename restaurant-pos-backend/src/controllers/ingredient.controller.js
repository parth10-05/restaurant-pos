import { ingredientService } from '../services/ingredient.service.js';

export const ingredientController = {
  /**
   * Get all ingredients
   */
  async getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
      };

      const ingredients = await ingredientService.getAllIngredients(filters);

      res.status(200).json({
        success: true,
        data: ingredients,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search ingredients by name
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const ingredients = await ingredientService.searchIngredients(q);

      res.status(200).json({
        success: true,
        data: ingredients,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get ingredient by ID
   */
  async getById(req, res, next) {
    try {
      const ingredient = await ingredientService.getIngredientById(req.params.id);

      res.status(200).json({
        success: true,
        data: ingredient,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new ingredient
   */
  async create(req, res, next) {
    try {
      const ingredient = await ingredientService.createIngredient(req.body);

      res.status(201).json({
        success: true,
        message: 'Ingredient created successfully',
        data: ingredient,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update ingredient
   */
  async update(req, res, next) {
    try {
      const ingredient = await ingredientService.updateIngredient(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Ingredient updated successfully',
        data: ingredient,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete ingredient
   */
  async delete(req, res, next) {
    try {
      const ingredient = await ingredientService.deleteIngredient(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Ingredient deleted successfully',
        data: ingredient,
      });
    } catch (error) {
      next(error);
    }
  },
};
