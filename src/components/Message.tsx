import { Card, CardContent } from "@/components/ui/card"

// export const MessageCard = ({ role, content }: { role: string; content: string }) => (
//   <Card>
//     <CardContent className="p-4">
//       <p>
//         <strong>{role === "user" ? "You" : "AI"}:</strong> {content.slice(0, 200)}...
//       </p>
//     </CardContent>
//   </Card>
// )


export default function Message({ role, content }: { role: string; content: string }) {
    return (
      <Card className="mb-3">
        <CardContent className="whitespace-pre-wrap p-4">
          <p className="text-sm text-muted-foreground mb-1">{role.toUpperCase()}</p>
          <div>{content}</div>
        </CardContent>
      </Card>
    )
  }
