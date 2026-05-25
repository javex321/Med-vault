import { Router } from "express";

import { validateRequest } from "../../middleware/validate.middleware.js";
import { login, logout, me, refresh, register } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", validateRequest({ body: registerSchema }), register);
authRouter.post("/login", validateRequest({ body: loginSchema }), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
