// src/app.js

import cors from "cors";
import express from "express";
import morgan from "morgan";
import { config } from "./config/config.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import mainRouter from "./routers/mainRouter.js";

const app = express();

// Opciones de CORS
const corsOptions = {
	origin: config.CORS_ORIGIN,
	credentials: true,
};

console.log('CORS Origin configurado para:', config.CORS_ORIGIN);

// Middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cors(corsOptions));

// Rutas
app.use("/api", mainRouter);

// Middleware de manejo de errores (siempre al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(config.server.HOST,config.server.PORT, () => {
	console.log(
		`🚀 Server listening on http://${config.server.HOST}:${config.server.PORT}`,
	);
});

export default app;
