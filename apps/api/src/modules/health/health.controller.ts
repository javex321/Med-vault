import { HttpStatus } from "../../constants/http-status.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getHealthStatus } from "./health.service.js";

export const getHealth = asyncHandler(async (_req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;

  return sendSuccess(res, statusCode, health);
});
