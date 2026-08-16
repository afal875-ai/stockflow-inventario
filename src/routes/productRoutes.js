const express = require("express");

function createProductRouter(productController) {
  const router = express.Router();

  router.get("/summary", productController.summary);
  router.get("/", productController.list);
  router.get("/:id", productController.getById);
  router.post("/", productController.create);
  router.put("/:id", productController.update);
  router.delete("/:id", productController.delete);

  return router;
}

module.exports = createProductRouter;
