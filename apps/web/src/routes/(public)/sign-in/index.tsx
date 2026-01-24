import { SignIn } from '@/components/SignIn'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/sign-in/')({
  component: SignInPage,
})

function SignInPage() {
  return <SignIn/>
}