"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import { Bell, BellOff, Loader2 } from "lucide-react";
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

  /*
    Kad su push obavijesti već uključene,
    više ne zauzimamo prostor na početnoj stranici.
  */
  if (status === "granted") {
    return null;
  }

  if (status === "unsupported") {
    return null;
  }

  if (status === "denied") {
    return (
      <div className="mt-6 flex items-start gap-4 rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <BellOff size={24} />
        </div>

        <div>
          <h2 className="text-[18px] font-bold text-neutral-900">
            Obavijesti su blokirane
          </h2>

          <p className="mt-1 text-[16px] leading-6 text-neutral-600">
            Dopuštenje možete ponovno uključiti u
            postavkama preglednika.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-3xl bg-red-600 p-5 text-white shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Bell size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold">
            Uključite obavijesti
          </h2>

          <p className="mt-1 text-[16px] leading-6 text-red-50">
            Primajte promjene rasporeda i važne
            informacije odmah na mobitel.
          </p>

          <button
            type="button"
            onClick={ukljuciObavijesti}
            disabled={ucitavanje}
            className="mt-4 flex min-h-[50px] items-center justify-center rounded-2xl bg-white px-5 text-[16px] font-bold text-red-600 disabled:opacity-60"
          >
            {ucitavanje ? (
              <>
                <Loader2
                  size={20}
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