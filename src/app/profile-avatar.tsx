"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./account-profile.module.css";

export default function ProfileAvatar({ image, initial, className = styles.avatar }: { image?: string | null; initial: string; className?: string }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return <span className={className} aria-hidden="true">
    {image && failedImage !== image ? <Image src={image} alt="" width={58} height={58} unoptimized referrerPolicy="no-referrer" onError={() => setFailedImage(image)} /> : initial}
  </span>;
}
