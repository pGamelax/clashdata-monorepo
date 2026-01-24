import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/provider/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button variant={"ghost"} onClick={() => setTheme(theme == "light" ? "dark" : "light")}>
      {theme == "light" ? <Moon/> : <Sun/>}
    </Button>
  );
}
