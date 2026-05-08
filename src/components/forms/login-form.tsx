"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email
        </label>
        <Input
          autoComplete="email"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <Input
          autoComplete="current-password"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      {error ? (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
