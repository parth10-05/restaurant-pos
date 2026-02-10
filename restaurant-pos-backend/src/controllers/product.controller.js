import { productService } from '../services/product.service.js';

export const productController = {
  async getAll(req, res, next) {
    try {
      const filters = {
        categoryId: req.query.categoryId,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search,
      };

      const products = await productService.getAllProducts(filters);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const product = await productService.deleteProduct(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },
};