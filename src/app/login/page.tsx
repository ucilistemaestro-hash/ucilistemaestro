"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [greska, setGreska] = useState("");
  const [ucitavanje, setUcitavanje] = useState(false);

  async function prijava(e: FormEvent) {
    e.preventDefault();

    setGreska("");
    setUcitavanje(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: lozinka,
    });

    if (error || !data.user) {
      setGreska("E-mail ili lozinka nisu ispravni.");
      setUcitavanje(false);
      return;
    }

    const { data: profil, error: profilError } = await supabase
      .from("profili")
      .select("uloga, ime_prezime, aktivan")
      .eq("id", data.user.id)
      .single();

    if (profilError || !profil) {
      setGreska("Nije moguće učitati korisnički profil.");
      setUcitavanje(false);
      return;
    }

    if (!profil.aktivan) {
      await supabase.auth.signOut();
      setGreska("Ovaj korisnički račun nije aktivan.");
      setUcitavanje(false);
      return;
    }

    if (profil.uloga === "administrator") {
  router.push("/admin");
} else if (profil.uloga === "profesor") {
  router.push("/profesor");
} else {
  router.push("/polaznik");
}
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            Učilište
          </p>

          <h1 className="text-4xl font-black tracking-tight text-neutral-900">
            MAESTRO
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Prijavite se u aplikaciju
          </p>
        </div>

        <form onSubmit={prijava} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              E-mail
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
              placeholder="ime@uciliste-maestro.hr"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Lozinka
            </label>

            <input
              type="password"
              required
              value={lozinka}
              onChange={(e) => setLozinka(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
              placeholder="••••••••"
            />
          </div>

          {greska && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {greska}
            </div>
          )}

          <button
            type="submit"
            disabled={ucitavanje}
            className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {ucitavanje ? "Prijava..." : "Prijavi se"}
          </button>
        </form>
      </div>
    </main>
  );
}