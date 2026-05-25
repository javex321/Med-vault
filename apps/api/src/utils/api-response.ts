import type { ApiSuccessResponse } from "@medvault/shared";
import type { Response } from "express";

export function sendSuccess<TData>(res: Response, statusCode: number, data: TData) {
  return res.status(statusCode).json({
    success: true,
    requestId: String(res.req.id),
    data
  } satisfies ApiSuccessResponse<TData>);
}
