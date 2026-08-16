# StockFlow — módulo de inventario

Proyecto web desarrollado para la evidencia **GA7-220501096-AA3-EV01: Codificación de módulos del software stand-alone, web y móvil**.

| Dato | Información |
|---|---|
| Aprendiz | Andres Avendaño Lopez |
| Ficha | 3235904 |
| Programa | Análisis y Desarrollo de Software |
| Módulo | Gestión de productos e inventario |
| Framework | Express 5 sobre Node.js |

## Funcionalidades

- Registro, consulta, edición y eliminación de productos.
- Búsqueda por nombre, SKU o categoría.
- Filtros por categoría y estado de existencias.
- Validación de datos y control de SKU duplicado.
- Estados automáticos: disponible, stock bajo y agotado.
- Resumen de referencias, unidades, alertas y valor del inventario.
- Interfaz adaptable para computador, tableta y móvil.
- API REST con manejo uniforme de errores.
- Pruebas automatizadas de las reglas de negocio.

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior.
- npm 10 o superior.

## Instalación y ejecución

Desde la carpeta del proyecto:

```bash
npm install
npm start
```

Abra <http://localhost:3000> en el navegador.

Durante el desarrollo puede activar el reinicio automático:

```bash
npm run dev
```

## Verificación

```bash
npm test
npm run lint
```

Las pruebas usan un directorio temporal y no modifican los datos de demostración.

## Estructura

```text
.
├── data/                    # Persistencia JSON local
├── docs/                    # Informe técnico y colección de API
├── public/                  # Interfaz web adaptable
│   ├── css/
│   └── js/
├── src/
│   ├── controllers/         # Adaptación de solicitudes HTTP
│   ├── middleware/          # Manejo centralizado de errores
│   ├── repositories/        # Acceso a los datos
│   ├── routes/              # Endpoints REST
│   ├── services/            # Reglas de negocio
│   └── utils/               # Utilidades compartidas
└── tests/                   # Pruebas automatizadas
```

## Documentación

- [Informe técnico y artefactos](docs/INFORME_TECNICO.md): alcance, historias de usuario, casos de uso, diagrama de clases, arquitectura, reglas, plan y pruebas.
- [Colección de solicitudes](docs/COLECCION_API.http): ejemplos para probar la API desde un cliente compatible con archivos HTTP.
- [Enlace del repositorio](ENLACE_REPOSITORIO.txt): URL requerida para entregar la evidencia.

## Datos y persistencia

Para facilitar la evaluación local, los productos se almacenan en `data/products.json`. El repositorio realiza escrituras atómicas mediante un archivo temporal y serializa las mutaciones. En una siguiente iteración, esta capa puede reemplazarse por una base de datos sin cambiar los controladores ni las reglas de negocio.

## Versionamiento

El código se entrega como repositorio Git. Para publicar una copia nueva:

```bash
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

Después de publicar, registre la URL real en `ENLACE_REPOSITORIO.txt`.

## Autor

**Andres Avendaño Lopez** — Ficha 3235904.
