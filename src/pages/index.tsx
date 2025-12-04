"use client";

import Button from "@/ui/button";
import { InputField } from "@/ui/inputField";
import { useActionState } from "react";
import { authenticate } from "@/lib/loginAction";
import Logo from "@/ui/logoMusiverse";

const initialState = {
  message: "",
  errors: { login: [], mdp: [] },
  values: { login: "", mdp: "" },
};

export default function Login() {
  const [state, formAction] = useActionState(authenticate, initialState);

  return (
    <main className="bg-(--background-purple) flex min-h-screen w-full flex-col items-center justify-center gap-y-10 text-(--text-color)">
      <Logo />
      <h1 className="font-bold text-[2em] text-center">Connectez-vous</h1>
      <form action={formAction} className="flex flex-col gap-4 w-1/3 min-w-[225px]">
        <div>
          <InputField
            type="text"
            label="Login"
            id="login"
            defaultValue={state.values?.login}
          />
          {state.errors?.login && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.login.join(", ")}
            </p>
          )}
        </div>
        <div>
          <InputField type="password" label="Mot de passe" id="mdp" />
          {state.errors?.mdp && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.mdp.join(", ")}
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
