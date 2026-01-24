import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import z from "zod";
import { Lock, Mail, Loader2, XCircle, User } from "lucide-react";
import { authClient } from "@/auth-client";
import { Link, useRouter } from "@tanstack/react-router";


const signUpSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
  name: z.string().min(1, "Nome obrigatório"),
});

type SignUpSchema = z.infer<typeof signUpSchema>;

export function SignUp() {
  const [serverError, setServerError] = useState<string | null>(null);

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });

  async function handleSignUp({ email, password, name }: SignUpSchema) {
    setServerError(null);

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: "/clans",
      },
      {
        onSuccess: () => {
          router.history.push("/clans");
        },

        onError: (context) => {
          setServerError(context.error.message || "Erro ao criar conta");
        },
      },
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-svh bg-background relative overflow-hidden">
      <div className="relative w-full max-w-100 px-6 flex flex-col items-center gap-8">
        <Link to={"/"} className="flex flex-col items-center gap-3 group">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path
                d="M4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M8 17V13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12 17V11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16 17V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 10C4 10 2 10 2 7C2 4 5 4 5 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M20 10C20 10 22 10 22 7C22 4 19 4 19 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tighter sm:text-3xl text-foreground">
            CLASH<span className="text-primary">DATA</span>
          </h1>
        </Link>

        <div className="w-full relative overflow-hidden bg-card/80 backdrop-blur-xl rounded-3xl border-2 border-border/50 shadow-2xl p-8 lg:p-10">
          <div className="relative mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Cadastrar
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Cadastre sua conta para continuar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(handleSignUp)}
            className="flex flex-col gap-5"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <User
                    className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      errors.name ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    {...register("name")}
                    placeholder="Nome"
                    className={`pl-11 h-12 bg-muted/30 backdrop-blur-sm border-none ring-2 transition-all rounded-xl ${
                      errors.name
                        ? "ring-destructive/50 bg-destructive/5"
                        : "ring-border/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs font-medium text-destructive ml-4 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      errors.email ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    {...register("email")}
                    placeholder="E-mail"
                    className={`pl-11 h-12 bg-muted/30 backdrop-blur-sm border-none ring-2 transition-all rounded-xl ${
                      errors.email
                        ? "ring-destructive/50 bg-destructive/5"
                        : "ring-border/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-destructive ml-4 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      errors.password ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="Senha"
                    className={`pl-11 h-12 bg-muted/30 backdrop-blur-sm border-none ring-2 transition-all rounded-xl ${
                      errors.password
                        ? "ring-destructive/50 bg-destructive/5"
                        : "ring-border/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive ml-4 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
         
            {serverError && (
              <div className="flex items-center gap-3 text-destructive bg-destructive/10 border-2 border-destructive/20 p-4 rounded-xl backdrop-blur-sm">
                <XCircle size={18} />
                <span className="text-sm font-semibold">{serverError}</span>
              </div>
            )}

            <div className="space-y-5 mt-2">
              <Button
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  to="/sign-in"
                  className="font-bold text-primary hover:underline underline-offset-4 transition-colors"
                >
                  Entre agora
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
