import { AgronomistImagePayload } from '@models/index';

export interface CompressedAgronomistImage extends AgronomistImagePayload {
  dataUrl: string;
}

const MAX_INPUT_FILE_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION_PX = 1280;
const JPEG_QUALITY = 0.84;

/**
 * Resizes and compresses a crop/soil image on an offscreen canvas so uploads stay fast
 * and comfortably under Gemini Free Tier token/payload budgets.
 */
export async function compressAgronomistImage(file: File): Promise<CompressedAgronomistImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido (JPG, PNG o WebP).');
  }
  if (file.size > MAX_INPUT_FILE_BYTES) {
    throw new Error('La imagen seleccionada supera 15 MB. Prueba con una foto más liviana.');
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const img = await loadHtmlImage(originalDataUrl);

  const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(img.width || 1, img.height || 1));
  const targetWidth = Math.max(1, Math.round((img.width || MAX_DIMENSION_PX) * scale));
  const targetHeight = Math.max(1, Math.round((img.height || MAX_DIMENSION_PX) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo procesar la imagen en este navegador.');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const outputMime: 'image/jpeg' | 'image/webp' =
    file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const compressedDataUrl = canvas.toDataURL(outputMime, JPEG_QUALITY);
  const commaIdx = compressedDataUrl.indexOf(',');
  const dataBase64 = commaIdx >= 0 ? compressedDataUrl.slice(commaIdx + 1) : '';

  if (!dataBase64) {
    throw new Error('No se pudo codificar la imagen para enviarla al asistente.');
  }

  return {
    name: file.name,
    mimeType: outputMime,
    dataBase64,
    dataUrl: compressedDataUrl,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('El archivo seleccionado no es una imagen legible.'));
    img.src = src;
  });
}
