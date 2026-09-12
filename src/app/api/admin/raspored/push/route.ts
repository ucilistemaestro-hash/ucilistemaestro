import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

type VrstaObavijesti =
  | "novo"
  | "promjena"
  | "otkazano";

type RequestBody = {
  predavanje_id?: string;
  vrsta?: VrstaObavijesti;
};

type ObavijestZaSpremanje = {
  naslov: string;
  poruka: string;
  link: string;
  cilj:
    | "skupina"
    | "korisnik";
  skupina_id:
    | string
    | null;
  korisnik_id:
    | string
    | null;
  aktivna: boolean;
  datum_objave: string;
  created_by: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabaseSecretKey =
      process.env
        .SUPABASE_SECRET_KEY;

    const oneSignalAppId =
      process.env
        .ONESIGNAL_APP_ID;

    const oneSignalApiKey =
      process.env
        .ONESIGNAL_API_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey ||
      !supabaseSecretKey ||
      !oneSignalAppId ||
      !oneSignalApiKey
    ) {
      return NextResponse.json(
        {
          error:
            "Nedostaju serverske postavke.",
        },
        {
          status: 500,
        }
      );
    }

    const supabaseUrlValue: string =
      supabaseUrl;

    const supabasePublishableKeyValue: string =
      supabasePublishableKey;

    const supabaseSecretKeyValue: string =
      supabaseSecretKey;

    const oneSignalAppIdValue: string =
      oneSignalAppId;

    const oneSignalApiKeyValue: string =
      oneSignalApiKey;

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Niste prijavljeni.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.replace(
        "Bearer ",
        ""
      );

    /*
      Provjera prijavljenog korisnika.
    */
    const supabaseAuth =
      createClient(
        supabaseUrlValue,
        supabasePublishableKeyValue,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        }
      );

    const {
      data: { user },
      error: userError,
    } =
      await supabaseAuth.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Prijava je istekla. Prijavite se ponovno.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      Administratorski Supabase klijent.
    */
    const supabaseAdmin =
      createClient(
        supabaseUrlValue,
        supabaseSecretKeyValue,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        }
      );

    /*
      Provjera administratorskih ovlasti.
    */
    const {
      data: adminProfil,
      error: adminError,
    } = await supabaseAdmin
      .from("profili")
      .select(
        "id, uloga, aktivan"
      )
      .eq(
        "id",
        user.id
      )
      .single();

    if (
      adminError ||
      !adminProfil ||
      adminProfil.uloga !==
        "administrator" ||
      adminProfil.aktivan !==
        true
    ) {
      return NextResponse.json(
        {
          error:
            "Nemate administratorske ovlasti.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as RequestBody;

    const predavanjeId =
      body.predavanje_id?.trim();

    const vrsta =
      body.vrsta;

    if (
      !predavanjeId ||
      !vrsta
    ) {
      return NextResponse.json(
        {
          error:
            "Nedostaju podaci o terminu.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      vrsta !== "novo" &&
      vrsta !== "promjena" &&
      vrsta !== "otkazano"
    ) {
      return NextResponse.json(
        {
          error:
            "Nepoznata vrsta obavijesti.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Dohvati termin.
    */
    const {
      data: predavanje,
      error: predavanjeError,
    } = await supabaseAdmin
      .from("predavanja")
      .select(
        "id, naziv, datum, vrijeme_pocetka, vrijeme_zavrsetka, skupina_id, profesor_id, status"
      )
      .eq(
        "id",
        predavanjeId
      )
      .single();

    if (
      predavanjeError ||
      !predavanje
    ) {
      return NextResponse.json(
        {
          error:
            "Predavanje nije pronađeno.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Dohvati skupinu.
    */
    const {
      data: skupina,
      error: skupinaError,
    } = await supabaseAdmin
      .from(
        "obrazovne_skupine"
      )
      .select(
        "id, naziv"
      )
      .eq(
        "id",
        predavanje.skupina_id
      )
      .single();

    if (
      skupinaError ||
      !skupina
    ) {
      return NextResponse.json(
        {
          error:
            "Obrazovna skupina nije pronađena.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Dohvati aktivna članstva skupine.
    */
    const {
      data: clanstva,
      error: clanstvaError,
    } = await supabaseAdmin
      .from(
        "clanstva_skupina"
      )
      .select(
        "korisnik_id"
      )
      .eq(
        "skupina_id",
        predavanje.skupina_id
      )
      .eq(
        "status",
        "aktivan"
      );

    if (
      clanstvaError
    ) {
      return NextResponse.json(
        {
          error:
            "Nije moguće dohvatiti članove skupine.",
        },
        {
          status: 500,
        }
      );
    }

    const kandidatIds = [
      ...new Set(
        (
          clanstva ?? []
        ).map(
          (clanstvo) =>
            clanstvo.korisnik_id
        )
      ),
    ];

    /*
      Dohvati samo aktivne polaznike.
    */
    let polaznikIds: string[] =
      [];

    if (
      kandidatIds.length >
      0
    ) {
      const {
        data: polaznici,
        error:
          polazniciError,
      } = await supabaseAdmin
        .from("profili")
        .select("id")
        .in(
          "id",
          kandidatIds
        )
        .eq(
          "uloga",
          "polaznik"
        )
        .eq(
          "aktivan",
          true
        );

      if (
        polazniciError
      ) {
        return NextResponse.json(
          {
            error:
              "Nije moguće dohvatiti aktivne polaznike.",
          },
          {
            status: 500,
          }
        );
      }

      polaznikIds = (
        polaznici ?? []
      ).map(
        (polaznik) =>
          polaznik.id
      );
    }

    /*
      Dohvati aktivnog profesora
      koji je dodijeljen terminu.
    */
    let profesorId:
      | string
      | null = null;

    if (
      predavanje.profesor_id
    ) {
      const {
        data: profesor,
        error:
          profesorError,
      } = await supabaseAdmin
        .from("profili")
        .select(
          "id, uloga, aktivan"
        )
        .eq(
          "id",
          predavanje.profesor_id
        )
        .eq(
          "uloga",
          "profesor"
        )
        .eq(
          "aktivan",
          true
        )
        .maybeSingle();

      if (
        profesorError
      ) {
        return NextResponse.json(
          {
            error:
              "Nije moguće dohvatiti profesora termina.",
          },
          {
            status: 500,
          }
        );
      }

      if (
        profesor
      ) {
        profesorId =
          profesor.id;
      }
    }

    /*
      Formatiranje datuma.
    */
    function formatDatum(
      vrijednost: string
    ) {
      return new Date(
        vrijednost +
          "T12:00:00"
      ).toLocaleDateString(
        "hr-HR",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    }

    const vrijemePocetka =
      predavanje.vrijeme_pocetka.slice(
        0,
        5
      );

    const vrijemeZavrsetka =
      predavanje.vrijeme_zavrsetka.slice(
        0,
        5
      );

    let naslov =
      "Učilište Maestro";

    let poruka =
      "";

    if (
      vrsta === "novo"
    ) {
      naslov =
        "Novi termin nastave";

      poruka =
        `${predavanje.naziv} · ` +
        `${formatDatum(
          predavanje.datum
        )} · ` +
        `${vrijemePocetka} – ${vrijemeZavrsetka}. ` +
        `${skupina.naziv}.`;
    }

    if (
      vrsta === "promjena"
    ) {
      naslov =
        "Promjena rasporeda";

      poruka =
        `${predavanje.naziv} · ` +
        `${formatDatum(
          predavanje.datum
        )} · ` +
        `${vrijemePocetka} – ${vrijemeZavrsetka}. ` +
        `Provjerite ažurirani raspored u aplikaciji.`;
    }

    if (
      vrsta === "otkazano"
    ) {
      naslov =
        "Termin je otkazan";

      poruka =
        `${predavanje.naziv} · ` +
        `${formatDatum(
          predavanje.datum
        )} · ` +
        `${vrijemePocetka} – ${vrijemeZavrsetka}.`;
    }

    /*
      ==================================================
      SPREMANJE OBAVIJESTI
      ==================================================

      Prvi zapis:
      - cilj = skupina
      - vide ga aktivni polaznici te skupine

      Drugi zapis:
      - cilj = korisnik
      - vidi ga samo profesor tog termina
    */

    const datumObjave =
      new Date().toISOString();

    const obavijestiZaSpremanje:
      ObavijestZaSpremanje[] =
      [
        {
          naslov,
          poruka,
          link:
            "/polaznik/raspored",
          cilj:
            "skupina",
          skupina_id:
            predavanje.skupina_id,
          korisnik_id:
            null,
          aktivna:
            true,
          datum_objave:
            datumObjave,
          created_by:
            user.id,
        },
      ];

    if (
      profesorId
    ) {
      obavijestiZaSpremanje.push(
        {
          naslov,
          poruka,
          link:
            "/profesor/raspored",
          cilj:
            "korisnik",
          skupina_id:
            null,
          korisnik_id:
            profesorId,
          aktivna:
            true,
          datum_objave:
            datumObjave,
          created_by:
            user.id,
        }
      );
    }

    const {
      data:
        spremljeneObavijesti,
      error:
        obavijestiError,
    } = await supabaseAdmin
      .from("obavijesti")
      .insert(
        obavijestiZaSpremanje
      )
      .select(
        "id, cilj, skupina_id, korisnik_id"
      );

    if (
      obavijestiError ||
      !spremljeneObavijesti
    ) {
      console.error(
        "Greška spremanja obavijesti:",
        obavijestiError
      );

      return NextResponse.json(
        {
          error:
            "Raspored je spremljen, ali zapise u Obavijestima nije moguće spremiti.",

          detalj:
            obavijestiError?.message ??
            "Nepoznata greška.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      ==================================================
      ONESIGNAL PUSH
      ==================================================
    */
    async function posaljiPush(
      korisnici: string[],
      url: string
    ) {
      if (
        korisnici.length ===
        0
      ) {
        return 0;
      }

      const response =
        await fetch(
          "https://api.onesignal.com/notifications",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Key ${oneSignalApiKeyValue}`,
            },

            body:
              JSON.stringify({
                app_id:
                  oneSignalAppIdValue,

                target_channel:
                  "push",

                include_aliases:
                  {
                    external_id:
                      korisnici,
                  },

                headings: {
                  en:
                    naslov,
                },

                contents: {
                  en:
                    poruka,
                },

                url,
              }),
          }
        );

      const rezultat =
        await response.json();

      if (
        !response.ok
      ) {
        console.error(
          "OneSignal greška:",
          rezultat
        );

        throw new Error(
          "OneSignal nije prihvatio push obavijest."
        );
      }

      return korisnici.length;
    }

    /*
      Push polaznicima.
    */
    const brojPolaznika =
      await posaljiPush(
        polaznikIds,
        "https://app.uciliste-maestro.hr/polaznik/raspored"
      );

    /*
      Push profesoru.
    */
    const profesorIds =
      profesorId
        ? [profesorId]
        : [];

    const brojProfesora =
      await posaljiPush(
        profesorIds,
        "https://app.uciliste-maestro.hr/profesor/raspored"
      );

    return NextResponse.json(
      {
        success: true,

        obavijesti_spremljene:
          spremljeneObavijesti.length,

        obavijesti:
          spremljeneObavijesti,

        polaznici:
          brojPolaznika,

        profesori:
          brojProfesora,
      }
    );
  } catch (error) {
    console.error(
      "Greška automatske obavijesti rasporeda:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Automatsku obavijest rasporeda nije moguće dovršiti.",
      },
      {
        status: 500,
      }
    );
  }
}