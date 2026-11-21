import { Compass } from "lucide-react"
import ErrorScreen from "@/components/ui/ErrorScreen"

export default function NotFound() {
  return (
    <ErrorScreen
      icon={Compass}
      code="404"
      title="This page took a rest day"
      description="We couldn't find what you were looking for. It may have moved or never existed."
    />
  )
}
