// imageCompress.js
// Downscales and re-encodes a photo in the browser before it ever hits
// the network — a phone camera photo can be 4-8MB; nobody needs that
// much resolution to see "yes, the lock is broken." Resizing client-side
// also means the upload is fast even on the patchy connections that are
// realistic for this use case.

const MAX_DIMENSION = 1000; // px, longest side
const JPEG_QUALITY = 0.7;

// Takes a File (from an <input type="file"> or camera capture) and
// resolves to a compressed base64 data URL, or rejects if the file
// isn't a readable image.
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file isn't an image."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read the selected file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't decode the selected image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
