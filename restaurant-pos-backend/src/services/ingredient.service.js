import prisma from '../prisma/client.js';

/**
 * Ingredient Service
 * 
 * OPERATIONAL RULES:
 * - Ingredients are the raw materials used to prepare products
 * - Each ingredient has a name, unit, cost per unit, and minimum stock level
 * - Products can have multiple ingredients with specified quantities
 */

export const ingredientService = {
  /**
   * Get all active ingredients
   * @param {Object} filters - Optional filters
   * @returns {Array} List of ingredients
   */
  async getAllIngredients(filters = {}) {
    const where = {
      isActive: true,
      ...(filters.search && {
        name: {
          contains: filters.search,
          mode: 'insensitive',
        },
      }),
    };

    const ingredients = await prisma.ingredient.findMany({
      where,
      include: {
        stock: true,
      },
      orderBy: { name: 'asc' },
    });

    return ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit,
      minStock: ing.minStock,
      isActive: ing.isActive,
      currentStock: ing.stock?.quantity || 0,
    }));
  },

  /**
   * Search ingredients by name
   * @param {String} searchTerm - Search term
   * @returns {Array} List of matching ingredients
   */
  async searchIngredients(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const ingredients = await prisma.ingredient.findMany({
      where: {
        isActive: true,
        name: {
          contains: searchTerm.trim(),
          mode: 'insensitive',
        },
      },
      include: {
        stock: true,
      },
      orderBy: { name: 'asc' },
      take: 10, // Limit results for search
    });

    return ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit,
      minStock: ing.minStock,
      currentStock: ing.stock?.quantity || 0,
    }));
  },

  /**
   * Get single ingredient by ID
   * @param {String} id - Ingredient ID
   * @returns {Object} Ingredient
   */
  async getIngredientById(id) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        stock: true,
        productIngredients: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!ingredient) {
      const error = new Error('Ingredient not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      minStock: ingredient.minStock,
      isActive: ingredient.isActive,
      currentStock: ingredient.stock?.quantity || 0,
      usedInProducts: ingredient.productIngredients.map(pi => ({
        productId: pi.product.id,
        productName: pi.product.name,
        quantity: pi.quantity,
      })),
    };
  },

  /**
   * Create new ingredient
   * @param {Object} data - Ingredient data
   * @returns {Object} Created ingredient
   */
  async createIngredient(data) {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      const error = new Error('Ingredient name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!data.unit || data.unit.trim().length === 0) {
      const error = new Error('Unit is required (e.g., kg, g, l, ml, pcs)');
      error.statusCode = 400;
      throw error;
    }

    if (data.costPerUnit !== undefined && data.costPerUnit < 0) {
      const error = new Error('Cost per unit cannot be negative');
      error.statusCode = 400;
      throw error;
    }

    if (data.minStock !== undefined && data.minStock < 0) {
      const error = new Error('Minimum stock cannot be negative');
      error.statusCode = 400;
      throw error;
    }

    // Check if ingredient with same name already exists
    const existing = await prisma.ingredient.findFirst({
      where: {
        name: {
          equals: data.name.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      const error = new Error('Ingredient with this name already exists');
      error.statusCode = 409;
      throw error;
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name: data.name.trim(),
        unit: data.unit.trim(),
        costPerUnit: data.costPerUnit || 0,
        minStock: data.minStock || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    // Create initial stock record if initialStock is provided
    if (data.initialStock !== undefined && data.initialStock > 0) {
      await prisma.inventoryStock.create({
        data: {
          ingredientId: ingredient.id,
          quantity: data.initialStock,
        },
      });

      // Create ledger entry
      await prisma.inventoryLedger.create({
        data: {
          ingredientId: ingredient.id,
          changeQty: data.initialStock,
          balanceAfter: data.initialStock,
          source: 'MANUAL_ADJUSTMENT',
          notes: 'Initial stock',
        },
      });
    }

    return {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      minStock: ingredient.minStock,
      isActive: ingredient.isActive,
      currentStock: data.initialStock || 0,
    };
  },

  /**
   * Update ingredient
   * @param {String} id - Ingredient ID
   * @param {Object} data - Update data
   * @returns {Object} Updated ingredient
   */
  async updateIngredient(id, data) {
    await this.getIngredientById(id); // Check exists

    // Validate if provided
    if (data.costPerUnit !== undefined && data.costPerUnit < 0) {
      const error = new Error('Cost per unit cannot be negative');
      error.statusCode = 400;
      throw error;
    }

    if (data.minStock !== undefined && data.minStock < 0) {
      const error = new Error('Minimum stock cannot be negative');
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.unit && { unit: data.unit.trim() }),
        ...(data.costPerUnit !== undefined && { costPerUnit: data.costPerUnit }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        stock: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      unit: updated.unit,
      costPerUnit: updated.costPerUnit,
      minStock: updated.minStock,
      isActive: updated.isActive,
      currentStock: updated.stock?.quantity || 0,
    };
  },

  /**
   * Delete ingredient (soft delete)
   * @param {String} id - Ingredient ID
   * @returns {Object} Deleted ingredient
   */
  async deleteIngredient(id) {
    await this.getIngredientById(id);

    // Check if ingredient is used in any products
    const usageCount = await prisma.productIngredient.count({
      where: { ingredientId: id },
    });

    if (usageCount > 0) {
      const error = new Error(
        `Cannot delete ingredient. It is used in ${usageCount} product(s)`
      );
      error.statusCode = 400;
      throw error;
    }

    const deleted = await prisma.ingredient.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      id: deleted.id,
      name: deleted.name,
      isActive: deleted.isActive,
    };
  },
};
