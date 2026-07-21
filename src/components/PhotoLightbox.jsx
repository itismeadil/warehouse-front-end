import { useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Full-screen photo viewer. Click the backdrop or the X to close.
 * Click the image itself to toggle zoom in/out.
 *
 * Usage:
 *   const [openPhoto, setOpenPhoto] = useState(null);
 *   <img onClick={() => setOpenPhoto(photo.url)} ... />
 *   {openPhoto && (
 *     <PhotoLightbox url={openPhoto} onClose={() => setOpenPhoto(null)} />
 *   )}
 */
export default function PhotoLightbox({ url, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-e-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
        className="absolute bottom-4 inset-s-1/2 -translate-x-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        {zoomed ? (
          <ZoomOut className="h-5 w-5" />
        ) : (
          <ZoomIn className="h-5 w-5" />
        )}
      </button>

      <img
        src={url}
        alt=""
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
        className={`max-h-[90vh] max-w-full rounded-lg object-contain transition-transform duration-200 ${
          zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
        }`}
      />
    </div>
  );
}
