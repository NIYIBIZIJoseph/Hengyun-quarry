// src/lib/cropImage.ts
// Utility to crop an image given pixel + zoom parameters

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

export async function getCroppedImg(
  imageSrc: string,
  crop: CropArea,
  outputSize = 400
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Square output
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw the cropped portion, scaled to output size
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Return JPEG data URL (~80% quality keeps size low)
  return canvas.toDataURL('image/jpeg', 0.85);
}