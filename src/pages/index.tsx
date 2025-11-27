import Image from "next/image";
import Form from "next/form";
import { Geist, Geist_Mono } from "next/font/google";
import Button from "@/ui/button";
import { InputField } from "@/ui/inputField";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Login() {
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
      <Form action="/home" className="flex flex-col gap-4 w-1/3">
        <div>
          <InputField label="Login" id="login" />
        </div>
        <div>
          <InputField label="Mot de passe" id="mdp" />
        </div>
        <Button type="submit">
          Connexion
        </Button>
      </Form>
    </main>
  );
}
