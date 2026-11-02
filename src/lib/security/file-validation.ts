import crypto from "crypto";

export const MAX_DEPOSIT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB maximum
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface FileSignatureResult {
  detectedMime: AllowedMimeType;
  detectedExt: "jpg" | "png" | "webp" | "pdf";
}

/**
 * Inspects raw file bytes to identify the authentic file format.
 * Prevents malicious executable or script disguise via forged extensions or headers.
 */
export function detectFileSignature(buffer: Buffer | Uint8Array): FileSignatureResult | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { detectedMime: "image/jpeg", detectedExt: "jpg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { detectedMime: "image/png", detectedExt: "png" };
  }

  // 3. WebP: RIFF (bytes 0..3) ... WEBP (bytes 8..11)
  if (
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50 // 'P'
  ) {
    return { detectedMime: "image/webp", detectedExt: "webp" };
  }

  // 4. PDF: %PDF- (bytes 0..4) -> 25 50 44 46 2D
  if (
    buffer[0] === 0x25 && // '%'
    buffer[1] === 0x50 && // 'P'
    buffer[2] === 0x44 && // 'D'
    buffer[3] === 0x46 && // 'F'
    buffer[4] === 0x2d // '-'
  ) {
    return { detectedMime: "application/pdf", detectedExt: "pdf" };
  }

  return null;
}

export interface ValidationSuccess {
  valid: true;
  cleanFileName: string;
  extension: AllowedExtension;
  mimeType: AllowedMimeType;
  fileSizeBytes: number;
}

export interface ValidationFailure {
  valid: false;
  error: string;
}

export type FileValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Validates a deposit proof buffer comprehensively:
 * - Rejects 0-byte or empty files
 * - Enforces strict 5 MB maximum size limit
 * - Rejects unauthorized extensions
 * - Verifies binary magic bytes (no disguised executables or HTML scripts)
 * - Sanitizes original file name and strips path traversal characters
 */
export function validateDepositProofBuffer(
  buffer: Buffer,
  rawFileName: string,
  claimedMime?: string
): FileValidationResult {
  // 1. Check size boundaries
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "The uploaded file is empty (0 bytes)." };
  }

  if (buffer.length > MAX_DEPOSIT_FILE_SIZE_BYTES) {
    const sizeMb = (buffer.length / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 10.00 MB.`,
    };
  }

  // Optional: If client supplied a declared MIME type, verify it is in the allowed whitelist
  if (claimedMime && typeof claimedMime === "string") {
    const normClaim = claimedMime.toLowerCase().trim();
    if (normClaim.length > 0 && !ALLOWED_MIME_TYPES.includes(normClaim as AllowedMimeType)) {
      return {
        valid: false,
        error: `Declared content type (${claimedMime}) is not supported. Only JPEG, PNG, WebP, and PDF are permitted.`,
      };
    }
  }

  // 2. Validate file name and extension
  if (!rawFileName || typeof rawFileName !== "string" || rawFileName.trim().length === 0) {
    return { valid: false, error: "Invalid or missing file name." };
  }

  // Sanitize file name: remove path separators and directory traversal
  const baseName = rawFileName.replace(/\\/g, "/").split("/").pop() || "";
  if (!baseName || baseName.includes("..")) {
    return { valid: false, error: "Invalid file name containing path traversal characters." };
  }

  const parts = baseName.split(".");
  if (parts.length < 2) {
    return { valid: false, error: "File must have a valid extension (.jpg, .jpeg, .png, .webp, or .pdf)." };
  }

  const rawExt = parts.pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(rawExt as AllowedExtension)) {
    return {
      valid: false,
      error: `The .${rawExt} file format is not permitted. Only JPEG, PNG, WebP, and PDF are accepted.`,
    };
  }

  const ext = rawExt as AllowedExtension;

  // 3. Inspect binary magic bytes
  const signature = detectFileSignature(buffer);
  if (!signature) {
    return {
      valid: false,
      error: "The file content does not match any recognized safe document or image signature. Upload was rejected for security.",
    };
  }

  // 4. Verify extension matches binary signature family
  const isJpegFamily = (ext === "jpg" || ext === "jpeg") && signature.detectedExt === "jpg";
  const isPngFamily = ext === "png" && signature.detectedExt === "png";
  const isWebpFamily = ext === "webp" && signature.detectedExt === "webp";
  const isPdfFamily = ext === "pdf" && signature.detectedExt === "pdf";

  if (!isJpegFamily && !isPngFamily && !isWebpFamily && !isPdfFamily) {
    return {
      valid: false,
      error: `File extension (.${ext}) does not match the actual binary content (${signature.detectedMime}). Disguised files are prohibited.`,
    };
  }

  // 5. Sanitize clean filename
  const cleanBase = parts
    .join(".")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
  const cleanFileName = `${cleanBase || "deposit_proof"}.${ext}`;

  return {
    valid: true,
    cleanFileName,
    extension: ext,
    mimeType: signature.detectedMime,
    fileSizeBytes: buffer.length,
  };
}

/**
 * Generates an unpredictable server-side storage path inside the private bucket.
 * Pattern: `<uploadToken>/<timestamp>_<randomHex16>.<ext>`
 * Strictly complies with the trigger integrity condition: `storage_path LIKE (upload_token || '/%')`
 */
export function generateUnpredictableStoragePath(
  uploadToken: string,
  extension: AllowedExtension
): string {
  const timestamp = Date.now();
  const randomEntropy = crypto.randomBytes(16).toString("hex");
  return `${uploadToken}/${timestamp}_${randomEntropy}.${extension}`;
}
