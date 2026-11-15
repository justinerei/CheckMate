import Image from "next/image";
import styles from "./mascot.module.css";

type MascotState = "ready" | "focused" | "empty" | "celebrate" | "concerned";

export default function Mascot({ state, width, height, className }: { state: MascotState; width: number; height: number; className?: string }) {
  if (state === "concerned") return <Image src="/images/mate/concerned.png" width={width} height={height} className={[className, styles.concerned].filter(Boolean).join(" ")} alt="" aria-hidden="true" unoptimized />;
  return <picture style={{ display: "contents" }}><source media="(prefers-reduced-motion: reduce)" srcSet={`/images/mate/${state}-idle-still.png`} /><Image src={`/images/mate/${state}-idle.gif`} width={width} height={height} className={className} alt="" aria-hidden="true" unoptimized /></picture>;
}
