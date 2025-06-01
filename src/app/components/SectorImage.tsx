"use client";

import Image from "next/image";
import { CSSProperties } from "react";

interface SectorImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export default function SectorImage({
  src,
  alt,
  className = "",
  style,
  onClick,
}: SectorImageProps) {
  return (
    <div
      className={`relative sector-image-container ${className}`}
      style={{ aspectRatio: "16/9", ...style }}
      onClick={onClick}
    >
      <Image src={src} alt={alt} fill className="object-contain" priority />
    </div>
  );
}
