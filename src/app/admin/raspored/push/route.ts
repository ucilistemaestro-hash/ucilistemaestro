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

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    const oneSignalAppId =
      process.env.ONESIGNAL_APP_ID;

    const oneSignalApiKey =
      process.env.ONESIGNAL_API_KEY;

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
            "Nedostaju serverske postavke za slanje obavijesti.",
        },
        {
          status: 500,
        }
      );
    }

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
      Supabase klijent za provjeru
      prijavljenog korisnika.
    */
    const supabaseAuth =
      createClient(
        supabaseUrl,
        supabasePublishableKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
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
      Secret key ostaje samo na serveru.
    */
    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    /*
      Provjeri da je prijavljeni korisnik
      aktivni administrator.
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
      adminProfil.aktivan !== true
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
      ![
        "novo",
        "promjena",
        "otkazano",
      ].includes(vrsta)
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
      Učitaj termin iz baze.
    */
    const {
      data: predavanje,
      error: predavanjeError,
    } = await supabaseAdmin
      .from("predavanja")
      .select(
        "id, naziv, datum, vrijeme_pocetka, vrijeme_zavrsetka, skupina_id, profesor_id, ucionica_id, status"
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
      Naziv obrazovne skupine.
    */
    const {
      data: skupina,
    } = await supabaseAdmin
      .from(
        "obrazovne_skupine"
      )
      .select("naziv")
      .eq(
        "id",
        predavanje.skupina_id
      )
      .single();

    /*
      Članovi skupine.
    */
    const {
      data: clanstva,
      error: clanstvaError,
    } = await supabaseAdmin
      .from(
        "clanstva_skupina"
      )
      .select("korisnik_id")
      .eq(
        "skupina_id",
        predavanje.skupina_id
      )
      .eq(
        "status",
        "aktivan"
      );

    if (clanstvaError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće dohvatiti polaznike skupine.",
        },
        {
          status: 500,
        }
      );
    }

    const kandidatiPolaznika = [
      ...new Set(
        (clanstva ?? []).map(
          (clanstvo) =>
            clanstvo.korisnik_id
        )
      ),
    ];

    let polaznikIds: string[] =
      [];

    /*
      Uzmi samo aktivne korisnike
      s ulogom polaznik.
    */
    if (
      kandidatiPolaznika.length >
      0
    ) {
      const {
        data: profiliPolaznika,
        error:
          profiliPolaznikaError,
      } = await supabaseAdmin
        .from("profili")
        .select("id")
        .in(
          "id",
          kandidatiPolaznika
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
        profiliPolaznikaError
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
        profiliPolaznika ?? []
      ).map(
        (profil) =>
          profil.id
      );
    }

    /*
      Trenutni profesor termina.
    */
    let profesorIds: string[] =
      [];

    if (
      predavanje.profesor_id
    ) {
      const {
        data:
          profesorProfil,
      } = await supabaseAdmin
        .from("profili")
        .select("id")
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
        profesorProfil
      ) {
        profesorIds = [
          profesorProfil.id,
        ];
      }
    }

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

    const vrijeme =
      predavanje.vrijeme_pocetka.slice(
        0,
        5
      );

    const nazivSkupine =
      skupina?.naziv ??
      "obrazovna skupina";

    let naslov =
      "Učilište Maestro";

    let poruka = "";

    if (
      vrsta === "novo"
    ) {
      naslov =
        "Novi termin nastave";

      poruka =
        `${predavanje.naziv} · ` +
        `${formatDatum(
          predavanje.datum
        )} u ${vrijeme}. ` +
        `${nazivSkupine}.`;
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
        )} u ${vrijeme}. ` +
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
        )} u ${vrijeme}.`;
    }

    /*
      Slanje OneSignal push poruke.
    */
    async function posaljiPush(
      korisnici: string[],
      url: string
    ) {
      if (
        korisnici.length === 0
      ) {
        return {
          poslano: 0,
        };
      }

      const response =
        await fetch(
          "https://api.onesignal.com/notifications",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Key ${oneSignalApiKey}`,
            },

            body:
              JSON.stringify({
                app_id:
                  oneSignalAppId,

                target_channel:
                  "push",

                include_aliases: {
                  external_id:
                    korisnici,
                },

                headings: {
                  en: naslov,
                },

                contents: {
                  en: poruka,
                },

                url,
              }),
          }
        );

      const rezultat =
        await response.json();

      if (!response.ok) {
        console.error(
          "OneSignal greška:",
          rezultat
        );

        throw new Error(
          "OneSignal nije prihvatio obavijest."
        );
      }

      return {
        poslano:
          korisnici.length,
      };
    }

    /*
      Polaznici.
    */
    const polazniciRezultat =
      await posaljiPush(
        polaznikIds,
        "https://app.uciliste-maestro.hr/polaznik/raspored"
      );

    /*
      Profesor.
    */
    const profesorRezultat =
      await posaljiPush(
        profesorIds,
        "https://app.uciliste-maestro.hr/profesor/raspored"
      );

    return NextResponse.json({
      success: true,

      polaznici:
        polazniciRezultat.poslano,

      profesori:
        profesorRezultat.poslano,
    });
  } catch (error) {
    console.error(
      "Greška automatske obavijesti rasporeda:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Raspored je spremljen, ali push obavijest nije moguće poslati.",
      },
      {
        status: 500,
      }
    );
  }
}