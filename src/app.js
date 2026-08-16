const express = require("express");
const path = require("node:path");
const ProductController = require("./controllers/ProductController");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const ProductRepository = require("./repositories/ProductRepository");
const createProductRouter = require("./routes/productRoutes");
const ProductService = require("./services/ProductService");

async function createApp(options = {}) {
  const app = express();
  const dataFile = options.dataFile ?? path.join(__dirname, "../data/products.json");
  const publicDirectory = path.join(__dirname, "../public");
  const productRepository = new ProductRepository(dataFile);
  await productRepository.init();

  const productService = new ProductService(productRepository);
  const productController = new ProductController(productService);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(express.static(publicDirectory));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", service: "stockflow-inventario" });
  });
  app.use("/api/products", createProductRouter(productController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
