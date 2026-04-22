import { supabase } from "./supabase";

export const signUpWithPassword = async (
  email: string,
  password: string,
  displayName?: string,
) => {
  if (!supabase) throw new Error("Supabaseが未設定です");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });
  if (error) throw error;
  return data;
};

export const signInWithPassword = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabaseが未設定です");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Supabaseが未設定です");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const sendPasswordReset = async (email: string) => {
  if (!supabase) throw new Error("Supabaseが未設定です");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
  if (error) throw error;
};
