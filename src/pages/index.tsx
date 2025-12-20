"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Button from "@/ui/button";
import { InputField } from "@/ui/inputField";
import { useAuth } from "@/lib/authContext";
import Logo from "@/ui/logoMusiverse";

export default function Login() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const success = await login(username, password);
      if (success) {
        router.push("/home");
      } else {
        setError("Veuillez remplir tous les champs.");
      }
    } catch {
      setError("La connexion a échoué. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <main className="bg-(--background-yellow) flex min-h-screen w-full flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
      </main>
    );
  }

  return (
    <main className="bg-(--background-yellow) flex min-h-screen w-full flex-col items-center justify-center gap-y-10 text-(--text-color-black)">
      <Logo w={200} h={200} />
      <h1 className="font-bold text-[2em] text-center">Connectez-vous</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-1/3 min-w-[225px]">
        <div>
          <InputField
            type="text"
            label="Login"
            id="login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <InputField 
            type="password" 
            label="Mot de passe" 
            id="mdp"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connexion..." : "Connexion"}
        </Button>
      </form>
    </main>
  );
}
