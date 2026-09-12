"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    __maestroOneSignalInitPromise?: Promise<void>;
  }
}

const PRODUKCIJSKA_DOMENA =
  "app.uciliste-maestro.hr";

export default function OneSignalInit() {
  useEffect(() => {
    /*
      OneSignal pokrećemo samo na produkcijskoj domeni.
      Na localhostu se namjerno ne inicijalizira.
    */
    if (
      window.location.hostname !==
      PRODUKCIJSKA_DOMENA
    ) {
      return;
    }

    const appId =
      process.env
        .NEXT_PUBLIC_ONESIGNAL_APP_ID;

    if (!appId) {
      console.error(
        "NEXT_PUBLIC_ONESIGNAL_APP_ID nije postavljen."
      );
      return;
    }

    /*
      Nakon ove provjere TypeScript sigurno zna
      da je vrijednost string.
    */
    const oneSignalAppId: string =
      appId;

    let aktivno = true;

    async function inicijalizirajOneSignal() {
      try {
        /*
          Sprječava višestruku inicijalizaciju
          OneSignal SDK-a.
        */
        if (
          !window
            .__maestroOneSignalInitPromise
        ) {
          window.__maestroOneSignalInitPromise =
            OneSignal.init({
              appId:
                oneSignalAppId,
            });
        }

        await window
          .__maestroOneSignalInitPromise;

        if (!aktivno) {
          return;
        }

        /*
          Poveži trenutno prijavljenog korisnika
          s OneSignal External ID-em.
        */
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (
          aktivno &&
          user
        ) {
          await OneSignal.login(
            user.id
          );
        }
      } catch (error) {
        console.error(
          "OneSignal inicijalizacija nije uspjela:",
          error
        );
      }
    }

    void inicijalizirajOneSignal();

    /*
      Prati buduće prijave i odjave korisnika.
    */
    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (
            window.location.hostname !==
            PRODUKCIJSKA_DOMENA
          ) {
            return;
          }

          void (async () => {
            try {
              if (
                window
                  .__maestroOneSignalInitPromise
              ) {
                await window
                  .__maestroOneSignalInitPromise;
              }

              if (
                session?.user
              ) {
                await OneSignal.login(
                  session.user.id
                );
              } else {
                await OneSignal.logout();
              }
            } catch (error) {
              console.error(
                "OneSignal povezivanje korisnika nije uspjelo:",
                error
              );
            }
          })();
        }
      );

    return () => {
      aktivno = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}