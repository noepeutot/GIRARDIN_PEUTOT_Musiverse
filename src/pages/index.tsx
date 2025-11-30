'use client';

import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Button from "@/ui/button";
import { InputField } from "@/ui/inputField";
import { useActionState } from "react";
import { authenticate } from "@/lib/loginAction";
import { error } from "console";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const initialState = {
  message: "",
  errors: { login : [], mdp: [] },
  values: { login: "", mdp: "" },
};

export default function Login() {
  const [state, formAction] = useActionState(authenticate, initialState);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-y-10 py-32 px-16 text-pink-500">
      <Image
        src="/logoMusiverse.png"
        alt="Musiverse logo"
        width={100}
        height={20}
        priority
      />
      <h1 className="font-bold text-[2em]">Connectez-vous</h1>
      <form action={formAction} className="flex flex-col gap-4 w-1/3">
        <div>
          <InputField type="text" label="Login" id="login" defaultValue={state.values?.login}/>
          {state.errors?.login && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.login.join(', ')}
            </p>
          )}
        </div>
        <div>
          <InputField type="password" label="Mot de passe" id="mdp" />
          {state.errors?.mdp && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.mdp.join(', ')}
            </p>
          )}
        </div>
        <Button type="submit" formMethod="POST">
          Connexion
        </Button>
      </form>
    </main>
  );
}
