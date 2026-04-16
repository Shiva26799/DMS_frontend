import { toast } from "sonner";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validates file size. Returns true if valid, false otherwise.
 * Shows a toast error if validation fails.
 */
export const validateFileSize = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE) {
    toast.error(`File size exceeds 10MB limit (Current: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    return false;
  }
  return true;
};
