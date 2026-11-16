export default function LibraryIcon({ type, paperState }: { type: "quiz" | "key" | "paper"; paperState?: "attention" | "review" | "finalized" }) {
  return <svg aria-hidden="true" width="28" height="28" viewBox="0 0 32 32" fill="none" shapeRendering="crispEdges">
    {type === "key" && <>
      {/* An answer key has its own key-shaped silhouette. */}
      <path d="M17 3h7v2h3v3h2v7h-2v3h-3v2h-5v-2h-2v2h-2v2h-2v2h-2v3H8v2H3v-5h2v-3h3v-2h2v-2h2v-2h2v-2h1V8h2V5h2z" fill="#100e0e" />
      <path d="M19 5h5v2h2v2h1v5h-2v2h-2v2h-3v-2h-3v2h-2v2h-2v2h-2v2H9v3H5v-2h2v-3h3v-2h2v-2h2v-2h2v-2h1V9h2z" fill="#f9e8d6" />
      <path d="M20 8h4v4h-4z" fill="#100e0e" /><path d="M10 21h2v2h-2zm2-2h2v2h-2z" fill="#ff7000" />
    </>}
    {type === "quiz" && <>
      {/* A clipboard and question mark distinguish quizzes from keys. */}
      <path d="M6 5h7V3h6v2h7v24H6z" fill="#100e0e" />
      <path d="M8 7h4v2h8V7h4v20H8z" fill="#f9e8d6" />
      <path d="M13 5h6v3h-6z" fill="#ff7000" />
      <path d="M12 12h2v-2h5v2h2v4h-2v2h-2v2h-3v-4h3v-2h1v-2h-4v2h-2zm2 10h3v3h-3z" fill="#191414" />
    </>}
    {type === "paper" && <>
      <path d="M5 3h15v3h3v3h2v20H5z" fill="#100e0e" />
      <path d="M7 5h12v4h4v18H7z" fill="#f9e8d6" />
      <path d="M9 11h9v2H9zm0 4h7v2H9zm0 4h5v2H9z" fill="#191414" />
      {paperState === "attention" ? <><path d="M19 15h7v12h-7z" fill="#100e0e" /><path d="M21 16h3v6h-3zm0 8h3v2h-3z" fill="#ff7000" /></> : paperState === "finalized" ? <><path d="M14 22h3v2h2v-2h2v-2h2v-2h3v4h-2v2h-2v2h-2v2h-3v-2h-3z" fill="#100e0e" /><path d="M15 22h2v2h2v-2h2v-2h3v2h-2v2h-2v2h-3v-2h-2z" fill="#ff7000" /></> : paperState === "review" ? <><path d="M14 22h2v-3h2v-3h2v-3h2v-2h3v2h2v3h-2v3h-2v3h-2v3h-3v2h-4z" fill="#100e0e" /><path d="M22 13h2v2h-2zm-2 3h2v3h-2zm-2 3h2v3h-2zm-2 3h2v2h-2z" fill="#ff7000" /></> : <path d="M18 22h3v2h-3z" fill="#ff7000" />}
    </>}
  </svg>;
}
