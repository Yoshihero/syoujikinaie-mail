"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session || process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true") {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative bg-white">
      {/* Left side: Hero/Image section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 border-r border-border items-center justify-center overflow-hidden">
        {/* Placeholder image layer with overlay */}
        <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
        
        <div className="relative z-10 px-16 max-w-xl text-center">
          <img src="/logo.svg" alt="正直な家" className="h-12 w-auto mx-auto brightness-0 invert" />
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50 relative overflow-hidden">
        {/* Subtle background decoration on the right side */}
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[50vh] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Mail className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              システムへログイン
            </h2>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
              メルマガ配信システム
            </p>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="space-y-6">
                <Button
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="w-full h-14 text-base font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 rounded-xl border border-primary/10"
                  size="lg"
                >
                  <svg className="mr-2 h-5 w-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Googleアカウントでログイン
                </Button>
                
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 px-2 text-muted-foreground font-semibold tracking-wider">
                      Authorized Personnel Only
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
