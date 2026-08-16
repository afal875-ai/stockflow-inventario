/**
 * Adapta las solicitudes HTTP a las operaciones del servicio de productos.
 */
class ProductController {
  constructor(productService) {
    this.productService = productService;
  }

  list = async (request, response, next) => {
    try {
      const products = await this.productService.list(request.query);
      response.json({ data: products, count: products.length });
    } catch (error) {
      next(error);
    }
  };

  getById = async (request, response, next) => {
    try {
      const product = await this.productService.getById(request.params.id);
      response.json({ data: product });
    } catch (error) {
      next(error);
    }
  };

  create = async (request, response, next) => {
    try {
      const product = await this.productService.create(request.body);
      response.status(201).json({
        message: "Producto creado correctamente.",
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (request, response, next) => {
    try {
      const product = await this.productService.update(request.params.id, request.body);
      response.json({
        message: "Producto actualizado correctamente.",
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (request, response, next) => {
    try {
      await this.productService.delete(request.params.id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  summary = async (_request, response, next) => {
    try {
      const summary = await this.productService.getSummary();
      response.json({ data: summary });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ProductController;
