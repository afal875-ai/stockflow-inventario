const assert = require("node:assert/strict");
const { afterEach, beforeEach, describe, test } = require("node:test");
const { mkdtemp, rm } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const ProductRepository = require("../src/repositories/ProductRepository");
const ProductService = require("../src/services/ProductService");

const validProduct = {
  sku: "PRB-001",
  name: "Producto de prueba",
  description: "Registro utilizado en las pruebas automatizadas.",
  category: "Pruebas",
  quantity: 10,
  minStock: 3,
  unitPrice: 25000
};

describe("ProductService", () => {
  let temporaryDirectory;
  let service;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "stockflow-"));
    const repository = new ProductRepository(path.join(temporaryDirectory, "products.json"));
    await repository.init();
    service = new ProductService(repository);
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  test("crea un producto normalizando el SKU", async () => {
    const product = await service.create({ ...validProduct, sku: "prb-001" });

    assert.equal(product.sku, "PRB-001");
    assert.equal(product.status, "available");
    assert.ok(product.id);
  });

  test("impide registrar dos productos con el mismo SKU", async () => {
    await service.create(validProduct);

    await assert.rejects(
      () => service.create({ ...validProduct, name: "Otro producto" }),
      (error) => error.statusCode === 409
    );
  });

  test("rechaza cantidades negativas y campos obligatorios inválidos", async () => {
    await assert.rejects(
      () => service.create({ ...validProduct, name: "", quantity: -1 }),
      (error) => error.statusCode === 422 && error.details.length === 2
    );
  });

  test("actualiza las existencias y calcula el estado de stock bajo", async () => {
    const product = await service.create(validProduct);
    const updated = await service.update(product.id, { quantity: 3 });

    assert.equal(updated.quantity, 3);
    assert.equal(updated.status, "low");
  });

  test("calcula el resumen del inventario", async () => {
    await service.create(validProduct);
    await service.create({
      ...validProduct,
      sku: "PRB-002",
      name: "Producto agotado",
      quantity: 0
    });
    const summary = await service.getSummary();

    assert.deepEqual(summary, {
      totalProducts: 2,
      totalUnits: 10,
      inventoryValue: 250000,
      lowStock: 0,
      outOfStock: 1
    });
  });

  test("elimina un producto existente", async () => {
    const product = await service.create(validProduct);
    await service.delete(product.id);

    const products = await service.list();
    assert.equal(products.length, 0);
  });
});
