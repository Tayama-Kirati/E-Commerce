"use client";

import { toast as hotToast } from "react-hot-toast";

export const toast = {
  success: (msg: string) => hotToast.success(msg),
  error:   (msg: string) => hotToast.error(msg),
  info:    (msg: string) => hotToast(msg),
};
