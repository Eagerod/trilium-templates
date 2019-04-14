const app = require("./src");

(async () => {
    await app(process.env.TRILIUM_URL);
})();
