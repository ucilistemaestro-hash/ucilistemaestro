import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

type Cilj =
  | "svi"
  | "polaznici"
  | "profesori"
  | "skupina"
  | "korisnik";

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    const oneSignalAppId =
      process.env.ONESIGNAL_APP_ID;

    const oneSignalApiKey =
      process.env.ONESIGNAL_API_KEY;

    // Provjera svih potrebnih serverskih postavki
    const nedostaje: string[] = [];

    if (!supabaseUrl) {
      nedostaje.push(
        "NEXT_PUBLIC_SUPABASE_URL"
      );
    }

    if (
      !supabasePublishableKey
    ) {
      nedostaje.push(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      );
    }

    if (!supabaseSecretKey) {
      nedostaje.push(
        "SUPABASE_SECRET_KEY"
      );
    }

    if (!oneSignalAppId) {
      nedostaje.push(
        "ONESIGNAL_APP_ID"
      );
    }

    if (!oneSignalApiKey) {
      nedostaje.push(
        "ONESIGNAL_API_KEY"
      );
    }

    if (
      nedostaje.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Nedostaju serverske postavke: " +
            nedostaje.join(", "),
        },
        {
          status: 500,
        }
      );
    }

    /*
      Nakon gornje provjere znamo da sve vrijednosti postoje.
      Ove varijable TypeScript sada tretira kao obične stringove.
    */
    const supabaseUrlVrijednost =
      supabaseUrl as string;

    const supabasePublishableKeyVrijednost =
      supabasePublishableKey as string;

    const supabaseSecretKeyVrijednost =
      supabaseSecretKey as string;

    const oneSignalAppIdVrijednost =
      oneSignalAppId as string;

    const oneSignalApiKeyVrijednost =
      oneSignalApiKey as string;

    // Provjera prijave administratora
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

    const supabaseAuth =
      createClient(
        supabaseUrlVrijednost,
        supabasePublishableKeyVrijednost
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
            "Neispravna ili istekla prijava.",
        },
        {
          status: 401,
        }
      );
    }

    // Serverski Supabase klijent
    const supabaseAdmin =
      createClient(
        supabaseUrlVrijednost,
        supabaseSecretKeyVrijednost
      );

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

    // Dohvati podatke iz zahtjeva
    const body =
      await request.json();

    const naslov = String(
      body.naslov ?? ""
    ).trim();

    const poruka = String(
      body.poruka ?? ""
    ).trim();

    const link = String(
      body.link ?? ""
    ).trim();

    const cilj =
      body.cilj as Cilj;

    const skupinaId =
      body.skupina_id
        ? String(
            body.skupina_id
          )
        : null;

    const korisnikId =
      body.korisnik_id
        ? String(
            body.korisnik_id
          )
        : null;

    // Validacija
    if (
      !naslov ||
      !poruka
    ) {
      return NextResponse.json(
        {
          error:
            "Naslov i poruka su obavezni.",
        },
        {
          status: 400,
        }
      );
    }

    const dozvoljeniCiljevi: Cilj[] =
      [
        "svi",
        "polaznici",
        "profesori",
        "skupina",
        "korisnik",
      ];

    if (
      !dozvoljeniCiljevi.includes(
        cilj
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Neispravan cilj obavijesti.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      cilj === "skupina" &&
      !skupinaId
    ) {
      return NextResponse.json(
        {
          error:
            "Nije odabrana obrazovna skupina.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      cilj === "korisnik" &&
      !korisnikId
    ) {
      return NextResponse.json(
        {
          error:
            "Nije odabran profesor.",
        },
        {
          status: 400,
        }
      );
    }

    // Popis Supabase korisničkih ID-eva
    let korisnikIds: string[] =
      [];

    // Svi polaznici i profesori
    if (
      cilj === "svi"
    ) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("profili")
        .select("id")
        .eq(
          "aktivan",
          true
        )
        .in(
          "uloga",
          [
            "polaznik",
            "profesor",
          ]
        );

      if (error) {
        throw error;
      }

      korisnikIds = (
        data ?? []
      ).map(
        (red) => red.id
      );
    }

    // Samo polaznici
    if (
      cilj === "polaznici"
    ) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("profili")
        .select("id")
        .eq(
          "aktivan",
          true
        )
        .eq(
          "uloga",
          "polaznik"
        );

      if (error) {
        throw error;
      }

      korisnikIds = (
        data ?? []
      ).map(
        (red) => red.id
      );
    }

    // Svi profesori
    if (
      cilj === "profesori"
    ) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("profili")
        .select("id")
        .eq(
          "aktivan",
          true
        )
        .eq(
          "uloga",
          "profesor"
        );

      if (error) {
        throw error;
      }

      korisnikIds = (
        data ?? []
      ).map(
        (red) => red.id
      );
    }

    // Jedna obrazovna skupina
    if (
      cilj === "skupina" &&
      skupinaId
    ) {
      const {
        data: clanstva,
        error:
          clanstvaError,
      } = await supabaseAdmin
        .from(
          "clanstva_skupina"
        )
        .select(
          "korisnik_id"
        )
        .eq(
          "skupina_id",
          skupinaId
        )
        .in(
          "status",
          [
            "active",
            "aktivan",
          ]
        );

      if (
        clanstvaError
      ) {
        throw clanstvaError;
      }

      const clanIds = (
        clanstva ?? []
      ).map(
        (red) =>
          red.korisnik_id
      );

      if (
        clanIds.length > 0
      ) {
        const {
          data: profili,
          error:
            profiliError,
        } = await supabaseAdmin
          .from("profili")
          .select("id")
          .in(
            "id",
            clanIds
          )
          .eq(
            "aktivan",
            true
          )
          .eq(
            "uloga",
            "polaznik"
          );

        if (
          profiliError
        ) {
          throw profiliError;
        }

        korisnikIds = (
          profili ?? []
        ).map(
          (red) => red.id
        );
      }
    }

    // Određeni profesor
    if (
      cilj === "korisnik" &&
      korisnikId
    ) {
      const {
        data:
          odabraniProfesor,
        error:
          profesorError,
      } = await supabaseAdmin
        .from("profili")
        .select(
          "id, uloga, aktivan"
        )
        .eq(
          "id",
          korisnikId
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
        throw profesorError;
      }

      if (
        !odabraniProfesor
      ) {
        return NextResponse.json(
          {
            error:
              "Odabrani profesor nije pronađen ili nije aktivan.",
          },
          {
            status: 400,
          }
        );
      }

      korisnikIds = [
        odabraniProfesor.id,
      ];
    }

    // Ukloni eventualne duplikate
    korisnikIds = [
      ...new Set(
        korisnikIds
      ),
    ];

    if (
      korisnikIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: true,
          poslano: false,
          brojKorisnika: 0,
          message:
            "Nema aktivnih korisnika za ovaj odabir.",
        }
      );
    }

    // OneSignal zahtjev
    const oneSignalBody = {
      app_id:
        oneSignalAppIdVrijednost,

      target_channel:
        "push",

      include_aliases: {
        external_id:
          korisnikIds,
      },

      headings: {
        en: naslov,
      },

      contents: {
        en: poruka,
      },

      url:
        link ||
        "https://app.uciliste-maestro.hr",
    };

    const oneSignalResponse =
      await fetch(
        "https://api.onesignal.com/notifications",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Key ${oneSignalApiKeyVrijednost}`,
          },

          body:
            JSON.stringify(
              oneSignalBody
            ),
        }
      );

    const oneSignalData =
      await oneSignalResponse.json();

    // OneSignal je odbio zahtjev
    if (
      !oneSignalResponse.ok
    ) {
      console.error(
        "OneSignal greška:",
        oneSignalData
      );

      return NextResponse.json(
        {
          error:
            "OneSignal nije prihvatio push obavijest.",

          details:
            oneSignalData
              ?.errors ??
            null,
        },
        {
          status: 502,
        }
      );
    }

    // OneSignal ponekad vrati upozorenje
    if (
      oneSignalData?.errors
    ) {
      console.error(
        "OneSignal upozorenje:",
        oneSignalData.errors
      );
    }

    return NextResponse.json(
      {
        success: true,

        poslano:
          Boolean(
            oneSignalData?.id
          ),

        brojKorisnika:
          korisnikIds.length,

        pushId:
          oneSignalData?.id ??
          null,

        oneSignalErrors:
          oneSignalData
            ?.errors ??
          null,
      }
    );
  } catch (error) {
    console.error(
      "Push API greška:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Došlo je do greške kod slanja push obavijesti.",
      },
      {
        status: 500,
      }
    );
  }
}
