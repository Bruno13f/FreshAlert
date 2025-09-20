import express from "express";
import healthRoutes from "./health.js";
import atividadesRoutes from "./atividades.js";

const router = express.Router();

// Mount route modules
router.use("/", healthRoutes);
router.use("/atividades", atividadesRoutes);

export default router;
