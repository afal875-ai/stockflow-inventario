const { randomUUID } = require("node:crypto");
const AppError = require("../utils/AppError");

/**
 * Contiene las reglas de negocio del módulo de inventario.
 */
class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async list(filters = {}) {
    const products = await this.productRepository.findAll();
    const query = String(filters.q ?? "").trim().toLocaleLowerCase("es");
    const category = String(filters.category ?? "").trim().toLocaleLowerCase("es");
    const status = String(filters.status ?? "").trim();

    return products
      .filter((product) => {
        const searchableText = `${product.sku} ${product.name} ${product.category}`.toLocaleLowerCase("es");
        const matchesQuery = !query || searchableText.includes(query);
        const matchesCategory = !category || product.category.toLocaleLowerCase("es") === category;
        const matchesStatus = !status || this.getStatus(product) === status;
        return matchesQuery && matchesCategory && matchesStatus;
      })
      .map((product) => this.decorate(product))
      .sort((first, second) => first.name.localeCompare(second.name, "es"));
  }

  async getById(id) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new AppError("El producto solicitado no existe.", 404);
    }

    return this.decorate(product);
  }

  async create(payload) {
    const data = this.validate(payload);
    await this.ensureUniqueSku(data.sku);
    const timestamp = new Date().toISOString();
    const product = {
      id: randomUUID(),
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.productRepository.create(product);
    return this.decorate(product);
  }

  async update(id, payload) {
    const current = await this.productRepository.findById(id);

    if (!current) {
      throw new AppError("El producto que intenta editar no existe.", 404);
    }

    const data = this.validate({ ...current, ...payload });
    await this.ensureUniqueSku(data.sku, id);
    const updated = await this.productRepository.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    return this.decorate(updated);
  }

  async delete(id) {
    const deleted = await this.productRepository.delete(id);

    if (!deleted) {
      throw new AppError("El producto que intenta eliminar no existe.", 404);
    }
  }

  async getSummary() {
    const products = await this.productRepository.findAll();

    return products.reduce(
      (summary, product) => {
        summary.totalProducts += 1;
        summary.totalUnits += product.quantity;
        summary.inventoryValue += product.quantity * product.unitPrice;

        if (this.getStatus(product) === "low") {
          summary.lowStock += 1;
        }

        if (this.getStatus(product) === "out") {
          summary.outOfStock += 1;
        }

        return summary;
      },
      {
        totalProducts: 0,
        totalUnits: 0,
        inventoryValue: 0,
        lowStock: 0,
        outOfStock: 0
      }
    );
  }

  validate(payload) {
    const data = {
      sku: String(payload.sku ?? "").trim().toUpperCase(),
      name: String(payload.name ?? "").trim(),
      description: String(payload.description ?? "").trim(),
      category: String(payload.category ?? "").trim(),
      quantity: Number(payload.quantity ?? 0),
      minStock: Number(payload.minStock ?? 0),
      unitPrice: Number(payload.unitPrice)
    };
    const errors = [];

    if (!/^[A-Z0-9][A-Z0-9-]{2,19}$/.test(data.sku)) {
      errors.push("El SKU debe tener entre 3 y 20 caracteres alfanuméricos o guiones.");
    }

    if (data.name.length < 3 || data.name.length > 80) {
      errors.push("El nombre debe tener entre 3 y 80 caracteres.");
    }

    if (data.category.length < 3 || data.category.length > 40) {
      errors.push("La categoría debe tener entre 3 y 40 caracteres.");
    }

    if (data.description.length > 240) {
      errors.push("La descripción no puede superar 240 caracteres.");
    }

    if (!Number.isInteger(data.quantity) || data.quantity < 0) {
      errors.push("La cantidad debe ser un número entero mayor o igual que cero.");
    }

    if (!Number.isInteger(data.minStock) || data.minStock < 0) {
      errors.push("El inventario mínimo debe ser un número entero mayor o igual que cero.");
    }

    if (!Number.isFinite(data.unitPrice) || data.unitPrice < 0) {
      errors.push("El precio unitario debe ser un número mayor o igual que cero.");
    }

    if (errors.length > 0) {
      throw new AppError("Revise la información ingresada.", 422, errors);
    }

    return data;
  }

  async ensureUniqueSku(sku, excludedId = null) {
    const products = await this.productRepository.findAll();
    const duplicate = products.some(
      (product) => product.sku.toUpperCase() === sku.toUpperCase() && product.id !== excludedId
    );

    if (duplicate) {
      throw new AppError("Ya existe un producto registrado con ese SKU.", 409);
    }
  }

  getStatus(product) {
    if (product.quantity === 0) {
      return "out";
    }

    if (product.quantity <= product.minStock) {
      return "low";
    }

    return "available";
  }

  decorate(product) {
    return { ...product, status: this.getStatus(product) };
  }
}

module.exports = ProductService;
