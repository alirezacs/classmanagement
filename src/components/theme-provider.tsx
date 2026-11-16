"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => undefined });
export function ThemeProvider({ children }: { children: ReactNode }) { const [theme,setTheme]=useState<Theme>(() => typeof window !== "undefined" && localStorage.getItem("classroom-theme") === "dark" ? "dark" : "light"); useEffect(()=>{document.documentElement.classList.toggle("dark",theme==="dark");},[theme]); function toggle(){const next=theme==="dark"?"light":"dark";setTheme(next);document.documentElement.classList.toggle("dark",next==="dark");localStorage.setItem("classroom-theme",next);} return <ThemeContext.Provider value={{theme,toggle}}>{children}</ThemeContext.Provider>; }
export function useTheme(){return useContext(ThemeContext);}
