import prisma from '../prisma/client.js';

/**
 * Product Category Service
 * 
 * OPERATIONAL RULES:
 * - Categories organize menu items for POS ordering screen
 * - Sequence controls display order in POS
 * - Categories cannot be deleted if they have products
 * - Soft delete (active=false) is preferred
 */

export const categoryService = {
  /**
   * Get all categories, sorted by sequence
   */
  async getAllCategories(includeInactive = false) {
    const where = includeInactive ? {} : { active: true };

    const categories = await prisma.productCategory.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sequence: 'asc' },
    });

    return categories;
  },

  /**
   * Get single category by ID
   */
  async getCategoryById(id) {
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    return category;
  },

  /**
   * Create new category
   */
  async createCategory(data) {
    // Validate
    if (!data.name || data.name.trim().length === 0) {
      const error = new Error('Category name is required');
      error.statusCode = 400;
      throw error;
    }

    // Check for duplicate
    const existing = await prisma.productCategory.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      const error = new Error('Category with this name already exists');
      error.statusCode = 400;
      throw error;
    }

    // Auto-sequence: get max sequence + 1
    const maxSequence = await prisma.productCategory.aggregate({
      _max: { sequence: true },
    });

    const sequence = data.sequence || (maxSequence._max.sequence || 0) + 1;

    const category = await prisma.productCategory.create({
      data: {
        name: data.name,
        sequence,
        active: data.active !== undefined ? data.active : true,
      },
    });

    return category;
  },

  /**
   * Update category
   */
  async updateCategory(id, data) {
    const category = await this.getCategoryById(id);

    // Check name uniqueness if changing name
    if (data.name && data.name !== category.name) {
      const existing = await prisma.productCategory.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        const error = new Error('Category with this name already exists');
        error.statusCode = 400;
        throw error;
      }
    }

    const updated = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sequence !== undefined && { sequence: data.sequence }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return updated;
  },

  /**
   * Delete category (soft delete preferred)
   */
  async deleteCategory(id) {
    const category = await this.getCategoryById(id);

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      const error = new Error(
        `Cannot delete category with ${productCount} product(s). Please move or delete products first.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Soft delete
    const deleted = await prisma.productCategory.update({
      where: { id },
      data: { active: false },
    });

    return deleted;
  },
};