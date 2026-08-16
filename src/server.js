const createApp = require("./app");

const port = Number(process.env.PORT) || 3000;

createApp()
  .then((app) => {
    app.listen(port, () => {
      console.log(`StockFlow está disponible en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("No fue posible iniciar la aplicación:", error);
    process.exitCode = 1;
  });
