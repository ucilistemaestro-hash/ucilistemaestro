"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";
import { supabase } from "@/lib/supabase";

export default function OneSignalInit() {
  useEffect(() => {
    let aktivno = true;

    async function pokreniOneSignal() {
      try {
        await OneSignal.init({
          appId: "31b3133f-ff41-4e8f-871b-a5c39dc29468",
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerParam: {
            scope: "/",
          },
        });

        if (!aktivno) return;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await OneSignal.login(user.id);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            try {
              if (session?.user) {
                await OneSignal.login(session.user.id);
              } else {
                await OneSignal.logout();
              }
            } catch (error) {
              console.error(
                "Greška kod povezivanja OneSignal korisnika:",
                error
              );
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error(
          "OneSignal inicijalizacija nije uspjela:",
          error
        );
      }
    }

    const cleanupPromise = pokreniOneSignal();

    return () => {
      aktivno = false;

      cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup();
      });
    };
  }, []);

  return null;
}