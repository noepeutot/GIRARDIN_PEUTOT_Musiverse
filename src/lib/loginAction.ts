import { z } from 'zod';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  login: z.string()
    .min(1, { message: "Le login est requis." }),

  mdp: z.string()
    .min(1, {message: "Le mot de passe est requis." }), 
});


export async function authenticate(prevState : any, formData: FormData) {
  const rawLogin = formData.get('login') as string;
  const rawMdp = formData.get('mdp') as string;
  
  const validatedFields = loginSchema.safeParse({
    login: rawLogin,
    mdp: rawMdp,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Veuillez corriger les erreurs dans le formulaire.',
      values: {
        login: rawLogin,
        mdp: '',
      }
    };
  }

  try {
    redirect('/home'); 

  } catch (error) {
    // Gérer les erreurs d'authentification
    return {
      message: 'La connexion a échoué. Veuillez vérifier vos identifiants.',
      values: { login: rawLogin, mdp: ''}
    };
  }
}