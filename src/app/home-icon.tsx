export default function HomeIcon({ type }: { type: "check" | "create" | "key" | "attention" }) {
  return <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" shapeRendering="crispEdges">
    {type === "check" && <>
      {/* A stack of checked papers. */}
      <path d="M5 3h16v3h3v2h2v19H9v-3H5z" fill="#100e0e" />
      <path d="M7 5h13v3h3v2h1v15H11v-3H7z" fill="#d6bca8" />
      <path d="M3 8h16v2h3v2h2v17H3z" fill="#100e0e" />
      <path d="M5 10h13v3h4v14H5z" fill="#f9e8d6" />
      <path d="M8 14h7v2H8zm0 4h5v2H8z" fill="#191414" />
      <path d="M12 22h2v2h2v-2h2v-2h2v-2h3v3h-2v2h-2v2h-2v2h-3v-2h-2z" fill="#ff7000" />
    </>}
    {type === "create" && <>
      {/* A pencil writing on a quiz. */}
      <path d="M4 3h15v2h2v2h2v21H4z" fill="#100e0e" />
      <path d="M6 5h12v3h3v18H6z" fill="#f9e8d6" />
      <path d="M9 10h7v2H9zm0 4h6v2H9zm0 4h5v2H9zm0 4h4v2H9z" fill="#191414" />
      <path d="M24 5h3v2h2v4h-2v3h-2v3h-2v3h-2v3h-3v2h-4v-4h2v-3h2v-3h2v-3h2V9h2z" fill="#100e0e" />
      <path d="M25 7h2v3h-2zm-2 4h2v3h-2zm-2 3h2v3h-2zm-2 3h2v3h-2z" fill="#ff7000" />
      <path d="M17 20h2v2h-2z" fill="#f9e8d6" />
    </>}
    {type === "key" && <>
      {/* A key with an add symbol. */}
      <path d="M7 4h8v2h3v3h2v6h-2v3h-3v2h-3v2h-2v2H8v3H4v-4h2v-3h2v-2h2v-2H7v-2H5v-4h2V7h2V6H7z" fill="#100e0e" />
      <path d="M9 6h6v2h2v2h1v4h-2v2h-3v2h-2v2H9v2H7v3H6v-2h2v-3h2v-2h2v-2H9v-2H7v-4h2z" fill="#f9e8d6" />
      <path d="M11 9h3v3h-3z" fill="#100e0e" />
      <path d="M23 16h3v4h4v3h-4v4h-3v-4h-4v-3h4z" fill="#100e0e" />
      <path d="M24 17h1v4h4v1h-4v4h-1v-4h-4v-1h4z" fill="#ff7000" />
    </>}
    {type === "attention" && <>
      {/* A notification bell with an orange badge. */}
      <path d="M14 3h4v2h3v2h2v3h1v9h2v3h2v3H4v-3h2v-3h2v-9h1V7h2V5h3z" fill="#100e0e" />
      <path d="M14 6h4v2h3v3h1v9h2v2H8v-2h2v-9h1V8h3z" fill="#f9e8d6" />
      <path d="M13 25h6v2h-1v2h-4v-2h-1z" fill="#ff7000" />
      <path d="M23 3h5v2h2v5h-2v2h-5v-2h-2V5h2z" fill="#100e0e" />
      <path d="M23 5h5v5h-5z" fill="#ff7000" />
    </>}
  </svg>;
}
