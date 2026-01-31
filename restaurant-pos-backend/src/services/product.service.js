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
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { category: { sequence: 'asc' } },
        { name: 'asc' },
      ],
    });

    return products;
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
      },
    });

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    return product;
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

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        taxPercent: data.taxPercent,
        categoryId: data.categoryId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sendToKitchen: data.sendToKitchen !== undefined ? data.sendToKitchen : true,
      },
      include: {
        category: true,
      },
    });

    return product;
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
      },
      include: {
        category: true,
      },
    });

    return updated;
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