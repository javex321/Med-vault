import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectMongo() {
  mongoose.connection.on("error", (error) => {
    logger.error({ error }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected");
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

export function getMongoStatus() {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}
