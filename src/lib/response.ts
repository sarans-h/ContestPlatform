import type { Response } from "express";

export type SuccessResponse<T extends object> = {
  success: true;
  data: T;
  error: null;
};

export type ErrorResponse = {
  success: false;
  data: null;
  error: string;
};

export function ok<T extends object>(res: Response, data: T, status = 200) {
  const body: SuccessResponse<T> = { success: true, data, error: null };
  return res.status(status).json(body);
}

export function fail(res: Response, errorCode: string, status = 400) {
  const body: ErrorResponse = { success: false, data: null, error: errorCode };
  return res.status(status).json(body);
}
