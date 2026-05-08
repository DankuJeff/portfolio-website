"use client";

import { useEffect, useCallback } from "react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
      style={{
        animation: "lightbox-in 0.2s ease",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes lightbox-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <button
        className="absolute top-4 right-4 p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
        onClick={onClose}
        aria-label="Close image"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {/* Stop propagation so clicking the image itself doesn't close */}
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        style={{ maxHeight: "calc(100vh - 4rem)", maxWidth: "calc(100vw - 4rem)" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
