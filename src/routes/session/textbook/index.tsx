import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/session/textbook/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/session/textbook/"!</div>
}
