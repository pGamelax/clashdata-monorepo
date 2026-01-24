import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Users, ChevronRight, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const Route = createFileRoute("/(home)/")({
  component: App,
});

function App() {

  useEffect(() => { 
    document.title = "Home | Clashdata";
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="grow">
        {/* --- HERO SECTION --- */}
        <section className="py-20 lg:py-32 px-6 relative overflow-hidden">
          <div className="relative max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border-2 border-primary/20 text-primary text-xs font-bold uppercase tracking-widest shadow-lg backdrop-blur-sm">
              <Target size={14} /> Performance de Elite em Tempo Real
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-tight text-foreground">
              Domine as Guerras com <br />
              <span className="text-primary italic">Dados Precisos.</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Acompanhe a destruição média, estrelas e atividade de cada
              jogador. Transforme seu clã em uma máquina de vitórias com
              analytics de alto nível.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/sign-up" className="hover:cursor-pointer">
                <Button
                  size="lg"
                  className="rounded-2xl h-14 px-8 text-lg w-full sm:w-auto hover:cursor-pointer hover:shadow-xl hover:scale-105 transition-all shadow-lg font-semibold"
                >
                  COMEÇAR AGORA <ChevronRight className="ml-2" size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section className="py-20 lg:py-32 bg-card/30 border-y border-border/30">
          <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Recursos para Gestão de Elite
              </h2>
              <p className="text-muted-foreground font-medium text-lg">
                Tudo o que você precisa para liderar o Hall da Fama.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {/* Feature 1 */}
              <div className="group relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-border/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="relative space-y-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-2xl w-fit border border-primary/20 shadow-md">
                    <BarChart3 size={28} />
                  </div>
                  <h3 className="text-xl font-bold">Analytics de Ataques</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Cálculo automático de porcentagem de destruição e média de
                    estrelas por guerra.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-border/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="relative space-y-4">
                  <div className="bg-amber-500/10 text-amber-500 p-4 rounded-2xl w-fit border border-amber-500/20 shadow-md">
                    <Trophy size={28} />
                  </div>
                  <h3 className="text-xl font-bold">Hall da Fama</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Ranking dinâmico dos melhores jogadores baseado em performance
                    histórica.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-border/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="relative space-y-4">
                  <div className="bg-blue-500/10 text-blue-500 p-4 rounded-2xl w-fit border border-blue-500/20 shadow-md">
                    <Users size={28} />
                  </div>
                  <h3 className="text-xl font-bold">Gestão de Clãs</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Importe múltiplos clãs e gerencie seus membros.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-32 relative">
          <div className="relative max-w-4xl mx-auto px-6">
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-xl rounded-[3rem] p-10 lg:p-16 text-center space-y-8 shadow-2xl border-2 border-border/50">
              <div className="relative space-y-6">
                <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                  Pronto para subir de liga?
                </h2>
                <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
                  Junte-se a centenas de líderes que já automatizaram{" "}
                  <br className="hidden md:block" /> sua análise de dados de
                  guerra.
                </p>
                <Link to="/" className="hover:cursor-pointer inline-block">
                  <Button
                    size="lg"
                    className="rounded-2xl h-14 px-8 text-lg hover:cursor-pointer hover:shadow-xl hover:scale-105 transition-all shadow-lg font-semibold"
                  >
                    Veja quem participa <ChevronRight className="ml-2" size={20} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
