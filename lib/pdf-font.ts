let cachedFontBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export async function loadPersianFontBase64() {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  const response = await fetch("/fonts/Vazirmatn-VariableFont_wght.ttf");

  if (!response.ok) {
    throw new Error("فایل فونت Vazirmatn-VariableFont_wght.ttf پیدا نشد.");
  }

  const buffer = await response.arrayBuffer();
  cachedFontBase64 = arrayBufferToBase64(buffer);

  return cachedFontBase64;
}