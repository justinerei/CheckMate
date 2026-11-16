export default function HomeIcon({ type }: { type: "check" | "create" | "key" | "attention" }) {
  return <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" shapeRendering="crispEdges">
    {type === "attention" ? <>
      <path d="M10 2h4v2h2v2h2v3h2v7h-2v2H6v-2H4V9h2V6h2V4h2z" fill="#f9e8d6" stroke="#100e0e" strokeWidth="2" />
      <path d="M10 19h4v2h-4zM11 7h2v6h-2zm0 8h2v2h-2z" fill="#ff7000" />
    </> : <>
      <path d="M4 2h11v2h2v2h2v16H4z" fill="#f9e8d6" stroke="#100e0e" strokeWidth="2" strokeLinejoin="miter" />
      <path d="M15 2v5h4" stroke="#100e0e" strokeWidth="2" />
      {type === "check" ? <><path d="M7 8h6v2H7zm0 4h5v2H7z" fill="#191414" /><path d="M8 16h2v2h2v-2h2v-2h2v-2h2v3h-2v2h-2v2h-2v2h-2v-1H8z" fill="#ff7000" /></> : type === "create" ? <><path d="M7 9h4v2H7zm0 4h4v2H7zm0 4h5v2H7z" fill="#191414" /><path d="M15 10h2v3h3v2h-3v3h-2v-3h-3v-2h3z" fill="#ff7000" /></> : <><path d="M7 8h5v2H7z" fill="#191414" /><path d="M6 13h3v2h2v2h2v-2h2v-2h2v-2h2v3h-2v2h-2v2h-2v2h-2v-1H9v-2H7v-2H6z" fill="#ff7000" /></>}
    </>}
  </svg>;
}
