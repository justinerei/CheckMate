import Image from "next/image";

type MascotState = "ready" | "focused" | "empty" | "celebrate";

export default function Mascot({ state, width, height, className }: { state: MascotState; width: number; height: number; className?: string }) {
  return <picture style={{ display: "contents" }}><source media="(prefers-reduced-motion: reduce)" srcSet={`/images/mate/${state}-idle-still.png`} /><Image src={`/images/mate/${state}-idle.gif`} width={width} height={height} className={className} alt="" aria-hidden="true" unoptimized /></picture>;
}
