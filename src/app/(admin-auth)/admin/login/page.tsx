"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type AdminLoginInput = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(schema) });

  async function onSubmit(data: AdminLoginInput) {
    setLoading(true);
    const res = await signIn("admin", { ...data, redirect: false });
    setLoading(false);

    if (res?.error) {
      toast.error("Incorrect email or password");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm rounded-md border border-bone/10 bg-ink p-8 text-bone">
        <div className="flex items-center gap-2 font-display text-xl font-extrabold">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-clay text-bone">S</span>
          Admin Login
        </div>
        <p className="mt-2 text-sm text-bone/60">Savanna &amp; Sole store management</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Label className="text-bone/70">Email</Label>
            <Input className="mt-1.5 border-bone/20 bg-ink text-bone" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-clay-light">{errors.email.message}</p>}
          </div>
          <div>
            <Label className="text-bone/70">Password</Label>
            <Input type="password" className="mt-1.5 border-bone/20 bg-ink text-bone" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-clay-light">{errors.password.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
