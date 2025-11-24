import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';

import { QrConfig } from '../types';

interface PosterGeneratorProps {
  backgroundImageUrl?: string; // Product specific image (optional overlay)
  width?: number; // Default base width
  overrideTitle?: string;
  isMaster?: boolean; // If true, strictly generates the Recruitment Poster (Long Map + QR)
  templateOverride?: string; // Allow passing a specific template (e.g. global default)
  qrConfigOverride?: QrConfig; // Allow passing specific QR config
  onImageGenerated?: (base64: string) => void; // Callback when generation completes
}

const PosterGenerator: React.FC<PosterGeneratorProps> = ({
  backgroundImageUrl,
  width = 750,
  overrideTitle,
  isMaster = false,
  templateOverride,
  qrConfigOverride,
  onImageGenerated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useUser();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawContent = async () => {
      try {
        setLoading(true);

        let canvasHeight = 1334; // Default fallback height
        let masterImg: HTMLImageElement | null = null;

        // Determine which template to use
        const templateSrc = templateOverride || (isMaster ? user.masterTemplate : null);

        // 1. Load Master Template First (If isMaster mode)
        if (isMaster && templateSrc) {
          try {
            masterImg = await loadImage(templateSrc);
            // Calculate height based on width=750 preserving aspect ratio
            const aspect = masterImg.height / masterImg.width;
            canvasHeight = width * aspect;
          } catch (e) {
            console.error("Failed to load master template", e);
          }
        } else if (!isMaster && backgroundImageUrl) {
          canvasHeight = width; // Square for products
        }

        // Set dimensions
        canvas.width = width;
        canvas.height = canvasHeight;

        // 2. Draw Background
        if (isMaster && masterImg) {
          // STRICT MODE: Only draw Master Template
          ctx.drawImage(masterImg, 0, 0, width, canvasHeight);
        } else if (!isMaster && backgroundImageUrl) {
          // Product Mode
          await drawImageSafe(ctx, backgroundImageUrl, 0, 0, width, canvasHeight, 'cover');
        } else {
          // Fallback
          ctx.fillStyle = '#F0F0F0';
          ctx.fillRect(0, 0, width, canvasHeight);
        }

        // 3. QR Code Logic (Strictly overlaid)
        if (isMaster) {
          // Use override or user config or default
          const config = qrConfigOverride || user.qrConfig || {
            x: 43, y: 1688, size: 166, zoom: 1.2, cropX: 0, cropY: -5
          };

          // Calculate scaling ratio based on a base width of 750
          const ratio = width / 750;

          const targetX = config.x * ratio;
          const targetY = config.y * ratio;
          const targetSize = config.size * ratio;
          const zoomLevel = config.zoom || 1;
          const cropX = config.cropX || 0;
          const cropY = config.cropY || 0;

          // Draw White Background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(targetX - 5, targetY - 5, targetSize + 10, targetSize + 10);

          // 3. Draw QR Code
          if (user.qrCode) {
            try {
              await drawImageSafe(
                ctx,
                user.qrCode,
                targetX,
                targetY,
                targetSize,
                targetSize,
                'cover',
                zoomLevel,
                cropX,
                cropY
              );
            } catch (e) {
              console.error("Failed to draw QR code", e);
              // Fallback placeholder if QR code fails to load/draw
              ctx.fillStyle = '#EEE';
              ctx.fillRect(targetX, targetY, targetSize, targetSize);
              ctx.fillStyle = '#999';
              ctx.font = '14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText("你的二维码", targetX + targetSize / 2, targetY + targetSize / 2);
            }
          } else {
            // Placeholder if no QR code is available
            ctx.fillStyle = '#EEE';
            ctx.fillRect(targetX, targetY, targetSize, targetSize);
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("你的二维码", targetX + targetSize / 2, targetY + targetSize / 2);
          }
        }

        // Generate Image URL
        const dataUrl = canvas.toDataURL('image/png');
        setGeneratedImage(dataUrl);

        // Callback to parent
        if (onImageGenerated) {
          onImageGenerated(dataUrl);
        }

      } catch (err) {
        console.error("Canvas drawing error", err);
      } finally {
        setLoading(false);
      }
    };

    drawContent();

  }, [user, backgroundImageUrl, width, overrideTitle, isMaster, templateOverride, qrConfigOverride, onImageGenerated]);

  // Helper to load image object
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const drawImageSafe = (
    ctx: CanvasRenderingContext2D,
    src: string,
    x: number,
    y: number,
    w: number,
    h: number,
    mode: 'cover' | 'contain' = 'contain',
    zoom: number = 1,
    cropShiftX: number = 0, // Percentage (-50 to 50)
    cropShiftY: number = 0  // Percentage (-50 to 50)
  ): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ratio = w / h;
        const imgRatio = img.width / img.height;

        let srcX = 0;
        let srcY = 0;
        let srcW = img.width;
        let srcH = img.height;

        if (mode === 'cover') {
          // 1. Calculate the base "Cover" rectangle (centered)
          if (imgRatio > ratio) {
            // Image is wider than target: trim width
            srcW = img.height * ratio;
            srcX = (img.width - srcW) / 2;
          } else {
            // Image is taller than target: trim height
            srcH = img.width / ratio;
            srcY = (img.height - srcH) / 2;
          }

          // 2. Apply Zoom (Take a smaller center chunk of that base rectangle)
          if (zoom > 1) {
            const zoomedW = srcW / zoom;
            const zoomedH = srcH / zoom;
            // Center logic
            srcX += (srcW - zoomedW) / 2;
            srcY += (srcH - zoomedH) / 2;

            // Update dim
            srcW = zoomedW;
            srcH = zoomedH;
          }

          // 3. Apply Pan (Shift)
          // cropShift is percentage relative to the *Original Image* dimensions to allow movement across the whole image
          // However, strictly moving the crop window is safer relative to the calculated srcW/srcH
          // Let's interpret cropShiftX as % of the source image width

          // Move the window
          srcX -= (cropShiftX / 100) * img.width;
          srcY -= (cropShiftY / 100) * img.height;

          ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, w, h);
        } else {
          ctx.drawImage(img, x, y, w, h);
        }
        resolve();
      };
      img.onerror = () => {
        console.warn("Image load failed", src);
        resolve();
      };
      img.src = src;
    });
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.download = `promo-poster-${Date.now()}.png`;
      link.href = generatedImage;
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3 w-full">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full shadow-lg rounded-lg overflow-hidden bg-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">正在合成海报...</div>
        ) : (
          generatedImage && <img src={generatedImage} alt="Generated Poster" className="w-full h-auto object-contain" />
        )}
      </div>

      <button
        onClick={handleDownload}
        className="w-full bg-xianyu-black text-white px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l3-3m-3 3h7.5" />
        </svg>
        下载合成海报
      </button>
    </div>
  );
};

export default PosterGenerator;