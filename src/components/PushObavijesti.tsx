"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import {
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Status =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export default function PushObavijesti() {
  const [status, setStatus] =
    useState<Status>("default");

  const [ucitavanje, setUcitavanje] =
    useState(false);

  const [poruka, setPoruka] =
    useState("");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      setStatus("unsupported");
      return;
    }

    setStatus(Notification.permission);
  }, []);

  async function ukljuciObavijesti() {
    try {
      setUcitavanje(true);
      setPoruka("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPoruka("Morate biti prijavljeni.");
        return;
      }

      await OneSignal.login(user.id);

      await OneSignal.Notifications.requestPermission();

      if ("Notification" in window) {
        setStatus(Notification.permission);
      }
    } catch (error) {
      console.error(error);

      setPoruka(
        "Obavijesti trenutačno nije moguće uključiti."
      );
    } finally {
      setUcitavanje(false);
    }
  }

  if (
    status === "granted" ||
    status === "unsupported"
  ) {
    return null;
  }

  if (status === "denied") {
    return (
      <section className="mt-6 rounded-[28px] border border-[#29292f] bg-[#16161a] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#24242a] text-red-500">
            <BellOff size={27} />
          </div>

          <div>
            <h2 className="text-[20px] font-bold text-white">
              Obavijesti su blokirane
            </h2>

            <p className="mt-2 text-[16px] leading-6 text-[#9b9ba4]">
              Dopuštenje možete ponovno uključiti
              u postavkama preglednika.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-[30px] bg-red-600 p-6 shadow-[0_15px_40px_rgba(220,38,38,0.18)]">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
          <Bell size={27} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[21px] font-black text-white">
            Uključite obavijesti
          </h2>

          <p className="mt-2 text-[16px] leading-6 text-red-50">
            Primajte promjene termina i važne
            informacije odmah na mobitel.
          </p>

          <button
            type="button"
            onClick={ukljuciObavijesti}
            disabled={ucitavanje}
            className="mt-5 flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-white px-5 text-[17px] font-black text-red-600 disabled:opacity-60"
          >
            {ucitavanje ? (
              <>
                <Loader2
                  size={21}
                  className="mr-2 animate-spin"
                />
                Uključivanje...
              </>
            ) : (
              "Uključi obavijesti"
            )}
          </button>

          {poruka && (
            <p className="mt-3 text-[15px] text-white">
              {poruka}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}