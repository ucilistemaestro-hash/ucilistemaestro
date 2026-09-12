"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalInit() {
  useEffect(() => {
    async function initOneSignal() {
      try {
        await OneSignal.init({
          appId: "31b3133f-ff41-4e8f-871b-a5c39dc29468",
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerParam: {
            scope: "/",
          },
        });
      } catch (error) {
        console.error(
          "OneSignal inicijalizacija nije uspjela:",
          error
        );
      }
    }

    initOneSignal();
  }, []);

  return null;
}