import prisma from '../prisma/client.js';

/**
 * Product Service
 * 
 * OPERATIONAL RULES:
 * - Products drive POS ordering screen
 * - price + taxPercent calculate order line totals
 * - sendToKitchen controls kitchen display visibility
 * - isActive=false hides product from POS (but remains in DB for historical orders)
 * - Products must belong to exactly one category
 */

export const productService = {
  /**
   * Get all products with category info
   * Sort by category.sequence then product.name
   */
  async getAllProducts(filters = {}) {
    const where = {
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        name: {
          contains: filters.search,
          mode: 'insensitive',
        },
      }),
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: [
        { category: { sequence: 'asc' } },
        { name: 'asc' },
      ],
    });

    return products.map(product => ({
      ...product,
      ingredients: product.productIngredients.map(pi => ({
        id: pi.ingredient.id,
        name: pi.ingredient.name,
        unit: pi.ingredient.unit,
        quantity: pi.quantity,
      })),
    }));
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId) {
    const products = await prisma.product.findMany({
      where: { categoryId },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    return products;
  },

  /**
   * Get single product
   */
  async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // Format the response
    return {
      ...product,
      ingredients: product.productIngredients.map(pi => ({
        id: pi.ingredient.id,
        name: pi.ingredient.name,
        unit: pi.ingredient.unit,
        quantity: pi.quantity,
      })),
    };
  },

  /**
   * Create new product
   */
  async createProduct(data) {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      const error = new Error('Product name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!data.categoryId) {
      const error = new Error('Category is required');
      error.statusCode = 400;
      throw error;
    }

    if (data.price === undefined || data.price < 0) {
      const error = new Error('Valid price is required');
      error.statusCode = 400;
      throw error;
    }

    if (data.taxPercent === undefined || data.taxPercent < 0 || data.taxPercent > 100) {
      const error = new Error('Tax percentage must be between 0 and 100');
      error.statusCode = 400;
      throw error;
    }

    // Check category exists
    const category = await prisma.productCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    // Validate ingredients if provided
    if (data.ingredients && Array.isArray(data.ingredients)) {
      for (const ing of data.ingredients) {
        if (!ing.ingredientId) {
          const error = new Error('Ingredient ID is required for each ingredient');
          error.statusCode = 400;
          throw error;
        }
        if (ing.quantity === undefined || ing.quantity <= 0) {
          const error = new Error('Valid ingredient quantity is required');
          error.statusCode = 400;
          throw error;
        }
      }

      // Check all ingredients exist
      const ingredientIds = data.ingredients.map(ing => ing.ingredientId);
      const existingIngredients = await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
      });

      if (existingIngredients.length !== ingredientIds.length) {
        const error = new Error('One or more ingredients not found');
        error.statusCode = 404;
        throw error;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        taxPercent: data.taxPercent,
        categoryId: data.categoryId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sendToKitchen: data.sendToKitchen !== undefined ? data.sendToKitchen : true,
        kitchenStation: data.kitchenStation || 'GENERAL',
        // Create product ingredients if provided
        ...(data.ingredients && data.ingredients.length > 0 && {
          productIngredients: {
            create: data.ingredients.map(ing => ({
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
            })),
          },
        }),
      },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    // Format the response
    return {
      ...product,
      ingredients: product.productIngredients.map(pi => ({
        id: pi.ingredient.id,
        name: pi.ingredient.name,
        unit: pi.ingredient.unit,
        quantity: pi.quantity,
      })),
    };
  },

  /**
   * Update product
   */
  async updateProduct(id, data) {
    await this.getProductById(id); // Check exists

    // Validate if provided
    if (data.price !== undefined && data.price < 0) {
      const error = new Error('Price cannot be negative');
      error.statusCode = 400;
      throw error;
    }

    if (data.taxPercent !== undefined && (data.taxPercent < 0 || data.taxPercent > 100)) {
      const error = new Error('Tax percentage must be between 0 and 100');
      error.statusCode = 400;
      throw error;
    }

    if (data.categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
      }
    }

    // Validate ingredients if provided
    if (data.ingredients && Array.isArray(data.ingredients)) {
      for (const ing of data.ingredients) {
        if (!ing.ingredientId) {
          const error = new Error('Ingredient ID is required for each ingredient');
          error.statusCode = 400;
          throw error;
        }
        if (ing.quantity === undefined || ing.quantity <= 0) {
          const error = new Error('Valid ingredient quantity is required');
          error.statusCode = 400;
          throw error;
        }
      }

      // Check all ingredients exist
      const ingredientIds = data.ingredients.map(ing => ing.ingredientId);
      const existingIngredients = await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
      });

      if (existingIngredients.length !== ingredientIds.length) {
        const error = new Error('One or more ingredients not found');
        error.statusCode = 404;
        throw error;
      }
    }

    // If ingredients are provided, update them
    if (data.ingredients !== undefined) {
      // Delete existing ingredients
      await prisma.productIngredient.deleteMany({
        where: { productId: id },
      });

      // Create new ingredients
      if (data.ingredients.length > 0) {
        await prisma.productIngredient.createMany({
          data: data.ingredients.map(ing => ({
            productId: id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
          })),
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.taxPercent !== undefined && { taxPercent: data.taxPercent }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sendToKitchen !== undefined && { sendToKitchen: data.sendToKitchen }),
        ...(data.kitchenStation && { kitchenStation: data.kitchenStation }),
      },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    // Format the response
    return {
      ...updated,
      ingredients: updated.productIngredients.map(pi => ({
        id: pi.ingredient.id,
        name: pi.ingredient.name,
        unit: pi.ingredient.unit,
        quantity: pi.quantity,
      })),
    };
  },

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id) {
    await this.getProductById(id);

    const deleted = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return deleted;
  },
};