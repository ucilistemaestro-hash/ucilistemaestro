"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function PostaviLozinkuPage() {
  const router = useRouter();

  const [
    lozinka,
    setLozinka,
  ] = useState("");

  const [
    ponovljenaLozinka,
    setPonovljenaLozinka,
  ] = useState("");

  const [
    prikaziLozinku,
    setPrikaziLozinku,
  ] = useState(false);

  const [
    prikaziPonovljenu,
    setPrikaziPonovljenu,
  ] = useState(false);

  const [
    provjera,
    setProvjera,
  ] = useState(true);

  const [
    spremanje,
    setSpremanje,
  ] = useState(false);

  const [
    imaSesiju,
    setImaSesiju,
  ] = useState(false);

  const [greska, setGreska] =
    useState("");

  const [uspjeh, setUspjeh] =
    useState(false);

  useEffect(() => {
    let aktivno = true;

    async function provjeriPristup() {
      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!aktivno) {
          return;
        }

        if (
          session?.user
        ) {
          setImaSesiju(
            true
          );
        }

        setProvjera(
          false
        );
      } catch (error) {
        console.error(
          "Greška provjere poveznice:",
          error
        );

        if (aktivno) {
          setProvjera(
            false
          );

          setGreska(
            "Poveznicu nije moguće provjeriti."
          );
        }
      }
    }

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session
        ) => {
          if (!aktivno) {
            return;
          }

          if (
            session?.user
          ) {
            setImaSesiju(
              true
            );

            setGreska(
              ""
            );
          }

          if (
            event ===
            "PASSWORD_RECOVERY"
          ) {
            setImaSesiju(
              true
            );

            setGreska(
              ""
            );
          }
        }
      );

    void provjeriPristup();

    return () => {
      aktivno = false;
      subscription.unsubscribe();
    };
  }, []);

  async function spremiNovuLozinku(
    e: FormEvent
  ) {
    e.preventDefault();

    if (spremanje) {
      return;
    }

    setGreska("");

    if (
      lozinka.length < 8
    ) {
      setGreska(
        "Nova lozinka mora imati najmanje 8 znakova."
      );
      return;
    }

    if (
      lozinka !==
      ponovljenaLozinka
    ) {
      setGreska(
        "Lozinke nisu jednake."
      );
      return;
    }

    setSpremanje(true);

    try {
      const {
        error,
      } =
        await supabase.auth.updateUser(
          {
            password:
              lozinka,
          }
        );

      if (error) {
        console.error(
          "Greška postavljanja lozinke:",
          error
        );

        setGreska(
          "Lozinku nije moguće postaviti. Poveznica je možda istekla."
        );
        return;
      }

      await supabase.auth.signOut();

      setUspjeh(
        true
      );

      setLozinka("");
      setPonovljenaLozinka("");
    } catch (error) {
      console.error(
        "Greška spremanja nove lozinke:",
        error
      );

      setGreska(
        "Lozinku trenutačno nije moguće spremiti."
      );
    } finally {
      setSpremanje(
        false
      );
    }
  }

  if (provjera) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4f6f8] px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            size={30}
            className="animate-spin text-[#c9252d]"
          />

          <p className="text-[14px] font-semibold text-[#66717d]">
            Provjera poveznice...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f6f8]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] items-center px-4 py-8">
        <div className="w-full overflow-hidden rounded-[28px] border border-[#e2e7ec] bg-white shadow-[0_18px_50px_rgba(16,36,55,0.10)]">
          <div className="h-1.5 w-full bg-[#c9252d]" />

          <div className="px-6 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/icon-512.png"
                alt="Učilište Maestro"
                width={140}
                height={140}
                priority
                className="h-auto w-[130px] object-contain"
              />

              <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f7] text-[#17324d]">
                {uspjeh ? (
                  <CheckCircle2
                    size={24}
                  />
                ) : (
                  <KeyRound
                    size={23}
                  />
                )}
              </div>

              <h1 className="mt-4 text-[26px] font-extrabold tracking-[-0.02em] text-[#17324d]">
                {uspjeh
                  ? "Lozinka je postavljena"
                  : "Postavite novu lozinku"}
              </h1>

              <p className="mt-2 max-w-[320px] text-[14px] leading-6 text-[#66717d]">
                {uspjeh
                  ? "Sada se možete prijaviti u Maestro aplikaciju svojom novom lozinkom."
                  : "Nova lozinka mora imati najmanje 8 znakova."}
              </p>
            </div>

            {uspjeh ? (
              <button
                type="button"
                onClick={() =>
                  router.replace(
                    "/login"
                  )
                }
                className="mt-7 flex min-h-[50px] w-full items-center justify-center rounded-xl bg-[#c9252d] px-5 text-[15px] font-bold text-white transition hover:bg-[#ad2027]"
              >
                Idi na prijavu
              </button>
            ) : !imaSesiju ? (
              <div className="mt-7">
                <div className="rounded-xl border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[14px] leading-6 text-[#a71d24]">
                  Ova poveznica nije valjana ili je istekla.
                  Zatražite novu poveznicu na stranici za
                  prijavu.
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.replace(
                      "/login"
                    )
                  }
                  className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#d7dee5] bg-white px-5 text-[14px] font-bold text-[#17324d] transition hover:bg-[#f4f6f8]"
                >
                  Povratak na prijavu
                </button>
              </div>
            ) : (
              <form
                onSubmit={
                  spremiNovuLozinku
                }
                className="mt-7 space-y-5"
              >
                <div>
                  <label
                    htmlFor="nova-lozinka"
                    className="mb-2 block text-sm font-semibold text-[#17202a]"
                  >
                    Nova lozinka
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66717d]"
                    />

                    <input
                      id="nova-lozinka"
                      type={
                        prikaziLozinku
                          ? "text"
                          : "password"
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={
                        lozinka
                      }
                      onChange={(
                        e
                      ) =>
                        setLozinka(
                          e.target.value
                        )
                      }
                      disabled={
                        spremanje
                      }
                      placeholder="Najmanje 8 znakova"
                      className="w-full rounded-xl border border-[#d7dee5] bg-white py-3.5 pl-11 pr-12 text-[16px] text-[#17202a] outline-none transition focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10 disabled:bg-[#f4f6f8]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setPrikaziLozinku(
                          (
                            trenutno
                          ) =>
                            !trenutno
                        )
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#66717d] hover:bg-[#f4f6f8]"
                    >
                      {prikaziLozinku ? (
                        <EyeOff
                          size={19}
                        />
                      ) : (
                        <Eye
                          size={19}
                        />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ponovi-lozinku"
                    className="mb-2 block text-sm font-semibold text-[#17202a]"
                  >
                    Ponovite novu lozinku
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66717d]"
                    />

                    <input
                      id="ponovi-lozinku"
                      type={
                        prikaziPonovljenu
                          ? "text"
                          : "password"
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={
                        ponovljenaLozinka
                      }
                      onChange={(
                        e
                      ) =>
                        setPonovljenaLozinka(
                          e.target.value
                        )
                      }
                      disabled={
                        spremanje
                      }
                      placeholder="Ponovite lozinku"
                      className="w-full rounded-xl border border-[#d7dee5] bg-white py-3.5 pl-11 pr-12 text-[16px] text-[#17202a] outline-none transition focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10 disabled:bg-[#f4f6f8]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setPrikaziPonovljenu(
                          (
                            trenutno
                          ) =>
                            !trenutno
                        )
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#66717d] hover:bg-[#f4f6f8]"
                    >
                      {prikaziPonovljenu ? (
                        <EyeOff
                          size={19}
                        />
                      ) : (
                        <Eye
                          size={19}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {greska && (
                  <div className="rounded-xl border border-[#f2c7ca] bg-[#fff5f5] px-4 py-3 text-[14px] leading-5 text-[#a71d24]">
                    {greska}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    spremanje
                  }
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#c9252d] px-5 text-[15px] font-bold text-white transition hover:bg-[#ad2027] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {spremanje && (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  )}

                  {spremanje
                    ? "Spremanje..."
                    : "Postavi novu lozinku"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}