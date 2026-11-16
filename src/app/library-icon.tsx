export default function LibraryIcon({ type }: { type: "quiz" | "key" | "paper" }) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" shapeRendering="crispEdges">
    <path d="M4 2h11v2h2v2h2v16H4z" fill="#f9e8d6" stroke="#100e0e" strokeWidth="2" strokeLinejoin="miter" />
    <path d="M15 2v5h4" stroke="#100e0e" strokeWidth="2" />
    {type === "key" ? <><path d="M6 13h3v2h2v2h2v-2h2v-2h2v-2h2v3h-2v2h-2v2h-2v2h-2v-1H9v-2H7v-2H6z" fill="#ff7000" /><path d="M7 8h5v2H7z" fill="#191414" /></> : type === "quiz" ? <><path d="M8 8h2V7h5v2h2v3h-2v2h-2v2h-3v-3h2v-2h2V9h-4v1H8zM10 18h3v2h-3z" fill="#191414" /><path d="M7 8h2v2H7z" fill="#ff7000" /></> : <><path d="M7 9h9v2H7zm0 4h9v2H7zm0 4h6v2H7z" fill="#191414" /><path d="M14 17h3v2h-3z" fill="#ff7000" /></>}
  </svg>;
}
