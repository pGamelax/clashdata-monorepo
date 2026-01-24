import { SignUp } from '@/components/SignUp'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/sign-up/')({
  component: SignUpPage,
})

function SignUpPage() {
  return <SignUp/>
}