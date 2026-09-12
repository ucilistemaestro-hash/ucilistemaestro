"use client";

import { useState } from "react";
import OneSignal from "react-onesignal";
import { supabase } from "@/lib/supabase";

export default function PushObavijesti() {
  const [poruka, setPoruka] = useState("");
  const [ucitavanje, setUcitavanje] = useState(false);

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

      // Povezuje OneSignal uređaj s našim Supabase korisnikom.
      await OneSignal.login(user.id);

      // Otvara sistemski zahtjev za dopuštenje obavijesti.
      await OneSignal.Notifications.requestPermission();

      if (OneSignal.Notifications.permission) {
        setPoruka("Obavijesti su uključene ✅");
      } else {
        setPoruka("Obavijesti nisu dopuštene.");
      }
    } catch (error) {
      console.error(error);
      setPoruka("Nije moguće uključiti obavijesti.");
    } finally {
      setUcitavanje(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
          🔔
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-neutral-900">
            Push obavijesti
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Primajte obavijesti o rasporedu, promjenama termina i
            važnim informacijama.
          </p>

          <button
            onClick={ukljuciObavijesti}
            disabled={ucitavanje}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {ucitavanje
              ? "Uključivanje..."
              : "Uključi obavijesti"}
          </button>

          {poruka && (
            <p className="mt-3 text-sm text-neutral-600">
              {poruka}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}