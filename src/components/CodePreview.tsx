"use client"
import { useEffect, useRef } from "react"

// export const CodePreview = ({ html }: { html: string }) => {
//   const iframeRef = useRef<HTMLIFrameElement>(null)

//   useEffect(() => {
//     if (iframeRef.current) iframeRef.current.srcdoc = html
//   }, [html])

//   return (
//     <div>
//       <h3 className="font-semibold my-2">Live Preview</h3>
//       <iframe ref={iframeRef} className="w-full h-[400px] border rounded" />
//     </div>
//   )
// }

export default function CodePreview({ html }: { html: string }) {
    return (
      <div className="mt-4 border rounded overflow-hidden">
        <iframe
          srcDoc={html}
          className="w-full h-[600px] border-none"
        />
      </div>
    )
  }