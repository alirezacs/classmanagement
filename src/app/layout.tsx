import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Classroom", template: "%s · Classroom" }, description: "A private workspace for classes, sessions, and attendance." };
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) { return <html lang="en" dir="ltr" data-scroll-behavior="smooth"><body><ThemeProvider>{children}</ThemeProvider></body></html>; }

