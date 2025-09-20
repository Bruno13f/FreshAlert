import express from "express";
import healthRoutes from "./health.js";
import atividadesRoutes from "./atividades.js";
import chatRoutes from "./chat.js";

const router = express.Router();

// Mount route modules
router.use("/", healthRoutes);
router.use("/atividades", atividadesRoutes);
router.use("/chat", chatRoutes);

export default router;
