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
      <section className="mt-6 rounded-2xl border border-[#e2e7ec] bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f6f7f9] text-[#66717d]">
            <BellOff size={23} />
          </div>

          <div>
            <h2 className="text-[18px] font-bold text-[#17202a]">
              Obavijesti su isključene
            </h2>

            <p className="mt-1 text-[16px] leading-6 text-[#66717d]">
              Možete ih ponovno omogućiti u postavkama
              preglednika.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[#dce3e9] bg-white">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
          <Bell size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-bold text-[#17202a]">
            Uključite obavijesti
          </h2>

          <p className="mt-1 text-[16px] leading-6 text-[#66717d]">
            Primajte promjene rasporeda i važne
            obavijesti Učilišta Maestro.
          </p>

          <button
            type="button"
            onClick={ukljuciObavijesti}
            disabled={ucitavanje}
            className="mt-4 flex min-h-[48px] items-center justify-center rounded-xl bg-[#17324d] px-5 text-[16px] font-bold text-white disabled:opacity-60"
          >
            {ucitavanje ? (
              <>
                <Loader2
                  size={19}
                  className="mr-2 animate-spin"
                />
                Uključivanje...
              </>
            ) : (
              "Uključi obavijesti"
            )}
          </button>

          {poruka && (
            <p className="mt-3 text-[14px] text-[#c9252d]">
              {poruka}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}