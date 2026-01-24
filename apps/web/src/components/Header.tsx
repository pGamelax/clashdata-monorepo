"use client";

import React, { useState } from "react";
import { authClient } from "@/auth-client";
import { cn } from "@/lib/utils";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { LogOut, Menu, LayoutDashboard, Shield, Users, BarChart3, Settings } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";

interface HeaderProps {
  user?: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
    role?: string | null;
  };
  userClans: {
    name: string;
    tag: string;
  }[];
}

const NAV_OPTIONS = [
  {
    name: "Wars",
    url: "/wars",
    dropdown: true,
    icon: LayoutDashboard,
  },
  {
    name: "Push",
    url: "/push",
    dropdown: true,
    icon: BarChart3,
  },
  { name: "Players", url: "/players", dropdown: false, icon: Users },
  { name: "Meus Clans", url: "/clans", dropdown: false, icon: Shield },
];

export function Header({ user, userClans }: HeaderProps) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.history.push("/sign-in");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border/50 bg-card/90 backdrop-blur-xl supports-backdrop-filter:bg-card/80 shadow-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-3 group"
            preload="intent"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/20 shadow-md group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
              <svg
                width="20"
                height="20"
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
            <span className="text-xl font-black tracking-tighter uppercase text-foreground">
              Clash<span className="text-primary font-extrabold">Data</span>
            </span>
          </Link>

          <nav className="hidden md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {user &&
                  NAV_OPTIONS.map((item) => (
                    <NavigationMenuItem key={item.name}>
                      {item.dropdown ? (
                        <>
                          <NavigationMenuTrigger className="bg-transparent font-semibold hover:bg-muted/50 data-[state=open]:bg-muted/50 rounded-lg transition-colors">
                            <item.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                            {item.name}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid gap-2 p-3 md:w-125 md:grid-cols-2 lg:w-150">
                              {userClans.map((clan) => (
                                <Link
                                  key={clan.tag}
                                  to={
                                    `${item.url}/${clan.tag.replace("#", "")}` as any
                                  }
                                  className="flex flex-col rounded-xl hover:bg-primary/10 border-2 border-transparent hover:border-primary/20 p-4 transition-all group"
                                >
                                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                    {clan.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-mono mt-1">
                                    {clan.tag}
                                  </span>
                                </Link>
                              ))}
                            </ul>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <Link
                          to={item.url}
                          preload="intent"
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "bg-transparent font-semibold hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-2",
                          )}
                        >
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.name}
                        </Link>
                      )}
                    </NavigationMenuItem>
                  ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>

        <div className="flex items-center gap-3">

          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all hover:ring-primary/30 hover:scale-105"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage
                        src={user.image || ""}
                        alt={user.name || ""}
                      />
                      <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 mt-2 bg-card/95 backdrop-blur-xl border-2 border-border/50 shadow-xl rounded-xl"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal px-4 py-3 border-b border-border/50">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-foreground">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground font-mono">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="cursor-pointer rounded-lg mx-1 my-1 focus:bg-accent focus:text-accent-foreground"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg mx-1 my-1"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden ml-2 border-2 border-border/50 hover:border-primary/30 rounded-xl"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 sm:w-96 bg-card/95 backdrop-blur-xl border-l-2 border-border/50">
                  <SheetHeader className="pb-6 border-b border-border/50">
                    <SheetTitle className="text-left font-black tracking-tighter uppercase flex flex-row gap-3 items-center">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/20">
                        <svg
                          width="20"
                          height="20"
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
                      <span className="text-foreground">
                        Clash<span className="text-primary">Data</span>
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 p-4 pt-6">
                    <Accordion type="single" collapsible className="w-full">
                      {NAV_OPTIONS.map((option) =>
                        option.dropdown ? (
                          <AccordionItem
                            value={option.name}
                            key={option.name}
                            className="border-none"
                          >
                            <AccordionTrigger className="py-3 text-base font-semibold hover:no-underline rounded-lg hover:bg-muted/50 px-3 transition-colors">
                              <div className="flex items-center gap-3">
                                <option.icon className="w-5 h-5 text-muted-foreground" />
                                {option.name}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2 pl-11 pt-2">
                              {userClans.map((clan) => (
                                <Link
                                  key={clan.tag}
                                  to={`${option.url}/${clan.tag.replace("#", "")}` as any}
                                  preload="intent"
                                  onClick={() => setIsMobileOpen(false)}
                                  className="py-2.5 px-3 text-sm rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all font-medium border-2 border-transparent hover:border-primary/20"
                                >
                                  {clan.name}
                                </Link>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        ) : (
                          <Link
                            key={option.name}
                            to={option.url}
                            preload="intent"
                            onClick={() => setIsMobileOpen(false)}
                            className="flex items-center gap-3 py-3 px-3 text-base font-semibold rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <option.icon className="w-5 h-5 text-muted-foreground" />
                            {option.name}
                          </Link>
                        ),
                      )}
                    </Accordion>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild size="sm" className="rounded-xl hover:bg-muted/50">
                <Link to="/sign-in" preload="intent">
                  Entrar
                </Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl px-6 shadow-md hover:shadow-lg transition-all">
                <Link to="/sign-up" preload="intent">
                  Começar
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-bold leading-none text-primary">
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
