// photoValidation.js
// Validates the optional photo attached to a check-in. Photos are sent
// as base64 data URLs and stored directly in the JSON store — no S3,
// no upload bucket, no external service to configure before a demo.
// The frontend downscales images before sending (see
// frontend/src/utils/imageCompress.js), but the backend re-checks
// independently since it can't trust the client to have done that.

const MAX_PHOTO_BASE64_CHARS = 2_000_000; // ~1.5MB of actual image data
const ALLOWED_PREFIXES = [
  "data:image/jpeg;base64,",
  "data:image/jpg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
];

// Returns { valid: true, photo } or { valid: false, error, status }.
// `photo` may legitimately be absent (undefined/null) — that's valid,
// since attaching a photo to a check-in is optional.
export function validatePhoto(photo) {
  if (photo === undefined || photo === null || photo === "") {
    return { valid: true, photo: null };
  }
  if (typeof photo !== "string") {
    return { valid: false, error: "photo must be a base64 data URL string", status: 400 };
  }
  if (!ALLOWED_PREFIXES.some((prefix) => photo.startsWith(prefix))) {
    return {
      valid: false,
      error: "photo must be a data:image/(jpeg|png|webp);base64,... URL",
      status: 400,
    };
  }
  if (photo.length > MAX_PHOTO_BASE64_CHARS) {
    return { valid: false, error: "photo is too large (max ~1.5MB)", status: 413 };
  }
  return { valid: true, photo };
}
