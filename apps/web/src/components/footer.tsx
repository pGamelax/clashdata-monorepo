export function Footer() {
  return (
    <footer className="w-full border-t-2 border-border/50 bg-card/90 backdrop-blur-xl mt-auto relative overflow-hidden shadow-lg">
      <div className="relative max-w-7xl mx-auto px-6 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 group">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border-2 border-primary/20 shadow-md group-hover:scale-110 transition-transform duration-300">
                <svg
                  width="24"
                  height="24"
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
              <div>
                <h1 className="text-xl font-black tracking-tighter sm:text-2xl text-foreground">
                  CLASH<span className="text-primary">DATA</span>
                </h1>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                  Analytics de Elite para Clans
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="text-xs font-medium text-muted-foreground space-y-3 text-center md:text-right">
              <p className="font-semibold text-foreground">© {new Date().getFullYear()} CLASHDATA — ANALYTICS TOOL</p>
              <div className="flex items-center justify-center md:justify-end gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="uppercase tracking-tighter font-bold text-xs">
                  Sincronizado com Supercell API
                </span>
              </div>
              <div className="text-[10px] leading-relaxed pt-2">
                <span className="uppercase tracking-tighter font-medium text-muted-foreground">
                  Este conteúdo não é afiliado, endossado, patrocinado ou
                  especificamente aprovado pela Supercell, e a Supercell não se
                  responsabiliza por ele. Para mais informações, consulte{" "}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-bold transition-colors"
                    href="https://supercell.com/en/fan-content-policy/"
                  >
                    políticas da Supercell
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
