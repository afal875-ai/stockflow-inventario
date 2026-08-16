const { mkdir, readFile, rename, writeFile } = require("node:fs/promises");
const path = require("node:path");

/**
 * Repositorio de productos basado en JSON.
 * Esta capa aísla la persistencia para que pueda reemplazarse posteriormente
 * por una base de datos sin modificar las reglas de negocio.
 */
class ProductRepository {
  constructor(filePath) {
    this.filePath = filePath;
    this.operationQueue = Promise.resolve();
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }

      await this.writeProducts([]);
    }
  }

  async findAll() {
    return this.readProducts();
  }

  async findById(id) {
    const products = await this.readProducts();
    return products.find((product) => product.id === id) ?? null;
  }

  async create(product) {
    return this.enqueue(async () => {
      const products = await this.readProducts();
      products.push(product);
      await this.writeProducts(products);
      return product;
    });
  }

  async update(id, changes) {
    return this.enqueue(async () => {
      const products = await this.readProducts();
      const index = products.findIndex((product) => product.id === id);

      if (index === -1) {
        return null;
      }

      products[index] = { ...products[index], ...changes };
      await this.writeProducts(products);
      return products[index];
    });
  }

  async delete(id) {
    return this.enqueue(async () => {
      const products = await this.readProducts();
      const index = products.findIndex((product) => product.id === id);

      if (index === -1) {
        return false;
      }

      products.splice(index, 1);
      await this.writeProducts(products);
      return true;
    });
  }

  async readProducts() {
    const content = await readFile(this.filePath, "utf8");
    const products = JSON.parse(content);

    if (!Array.isArray(products)) {
      throw new Error("El archivo de productos no contiene una colección válida.");
    }

    return products;
  }

  async writeProducts(products) {
    // La escritura temporal evita que el archivo principal quede incompleto.
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.filePath);
  }

  enqueue(operation) {
    // Serializa las mutaciones para prevenir pérdidas por escrituras simultáneas.
    const result = this.operationQueue.then(operation);
    this.operationQueue = result.catch(() => undefined);
    return result;
  }
}

module.exports = ProductRepository;
