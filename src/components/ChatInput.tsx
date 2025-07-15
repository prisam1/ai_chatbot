import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const ChatInput = ({ value, onChange, isLoading }: any) => (
  <div className="flex gap-2 mt-4">
    <Input
      value={value}
      onChange={onChange}
      placeholder="e.g., Hero landing with CTA and pricing"
      className="flex-1"
    />
    <Button type="submit" disabled={isLoading}>
      {isLoading ? "Generating..." : "Send"}
    </Button>
  </div>
)
