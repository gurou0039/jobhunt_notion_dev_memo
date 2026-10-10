import type { Metadata } from "next";
import { createClient } from "../lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Hunt Dashboard",
  description: "就職活動の予定・企業・選考状況を一元管理するダッシュボード",
};

function getThemeClass(settings: unknown) {
  if (
    typeof settings === "object" &&
    settings !== null &&
    "theme" in settings
  ) {
    const theme = (settings as { theme?: unknown }).theme;

    if (theme === "dark") {
      return "dark";
    }

    if (theme === "system") {
      return "theme-system";
    }

    if (theme === "light") {
      return "";
    }
  }

  return "theme-system";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const themeClass = getThemeClass(user?.user_metadata?.settings);

  return (
    <html
      lang="ja"
      className={`${themeClass} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
