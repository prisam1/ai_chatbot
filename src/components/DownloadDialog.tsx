// "use client"
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"

 
// export default function DownloadDialog({ code }: { code: string }) {
//     const downloadFile = () => {
//       const blob = new Blob([code], { type: "text/html" })
//       const url = URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = "landing-page.html"
//       a.click()
//     }
  

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <Button variant="outline">Download HTML</Button>
//       </DialogTrigger>
//       <DialogContent>
//         <p>Click below to download the generated HTML file.</p>
//         <Button onClick={downloadFile}>Download</Button>
//       </DialogContent>
//     </Dialog>
//   )
// }
