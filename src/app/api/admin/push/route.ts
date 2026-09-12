import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Cilj = "svi" | "polaznici" | "profesori" | "skupina";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    const oneSignalAppId = process.env.ONESIGNAL_APP_ID;
    const oneSignalApiKey = process.env.ONESIGNAL_API_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey ||
      !supabaseSecretKey ||
      !oneSignalAppId ||
      !oneSignalApiKey
    ) {
      return NextResponse.json(
        { error: "Nedostaju serverske postavke." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Niste prijavljeni." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "");

    const supabaseAuth = createClient(
      supabaseUrl,
      supabasePublishableKey
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Neispravna prijava." },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    const { data: adminProfil, error: adminError } =
      await supabaseAdmin
        .from("profili")
        .select("id, uloga, aktivan")
        .eq("id", user.id)
        .single();

    if (
      adminError ||
      !adminProfil ||
      adminProfil.uloga !== "administrator" ||
      adminProfil.aktivan !== true
    ) {
      return NextResponse.json(
        { error: "Nemate administratorske ovlasti." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const naslov = String(body.naslov ?? "").trim();
    const poruka = String(body.poruka ?? "").trim();
    const link = String(body.link ?? "").trim();
    const cilj = body.cilj as Cilj;
    const skupinaId = body.skupina_id
      ? String(body.skupina_id)
      : null;

    if (!naslov || !poruka) {
      return NextResponse.json(
        { error: "Naslov i poruka su obavezni." },
        { status: 400 }
      );
    }

    if (
      !["svi", "polaznici", "profesori", "skupina"].includes(
        cilj
      )
    ) {
      return NextResponse.json(
        { error: "Neispravan cilj obavijesti." },
        { status: 400 }
      );
    }

    if (cilj === "skupina" && !skupinaId) {
      return NextResponse.json(
        { error: "Nije odabrana obrazovna skupina." },
        { status: 400 }
      );
    }

    let korisnikIds: string[] = [];

    if (cilj === "svi") {
      const { data, error } = await supabaseAdmin
        .from("profili")
        .select("id")
        .eq("aktivan", true)
        .in("uloga", ["polaznik", "profesor"]);

      if (error) {
        throw error;
      }

      korisnikIds = (data ?? []).map((red) => red.id);
    }

    if (cilj === "polaznici") {
      const { data, error } = await supabaseAdmin
        .from("profili")
        .select("id")
        .eq("aktivan", true)
        .eq("uloga", "polaznik");

      if (error) {
        throw error;
      }

      korisnikIds = (data ?? []).map((red) => red.id);
    }

    if (cilj === "profesori") {
      const { data, error } = await supabaseAdmin
        .from("profili")
        .select("id")
        .eq("aktivan", true)
        .eq("uloga", "profesor");

      if (error) {
        throw error;
      }

      korisnikIds = (data ?? []).map((red) => red.id);
    }

    if (cilj === "skupina" && skupinaId) {
      const { data: clanstva, error: clanstvaError } =
        await supabaseAdmin
          .from("clanstva_skupina")
          .select("korisnik_id")
          .eq("skupina_id", skupinaId)
          .eq("status", "aktivan");

      if (clanstvaError) {
        throw clanstvaError;
      }

      const clanIds = (clanstva ?? []).map(
        (red) => red.korisnik_id
      );

      if (clanIds.length > 0) {
        const { data: profili, error: profiliError } =
          await supabaseAdmin
            .from("profili")
            .select("id")
            .in("id", clanIds)
            .eq("aktivan", true);

        if (profiliError) {
          throw profiliError;
        }

        korisnikIds = (profili ?? []).map((red) => red.id);
      }
    }

    korisnikIds = [...new Set(korisnikIds)];

    if (korisnikIds.length === 0) {
      return NextResponse.json({
        success: true,
        poslano: false,
        brojKorisnika: 0,
        message: "Nema aktivnih korisnika za ovaj odabir.",
      });
    }

    const oneSignalBody = {
      app_id: oneSignalAppId,
      target_channel: "push",
      include_aliases: {
        external_id: korisnikIds,
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

    const oneSignalResponse = await fetch(
      "https://api.onesignal.com/notifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${oneSignalApiKey}`,
        },
        body: JSON.stringify(oneSignalBody),
      }
    );

    const oneSignalData = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      console.error("OneSignal greška:", oneSignalData);

      return NextResponse.json(
        {
          error: "OneSignal nije prihvatio push obavijest.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      poslano: Boolean(oneSignalData.id),
      brojKorisnika: korisnikIds.length,
      pushId: oneSignalData.id ?? null,
    });
  } catch (error) {
    console.error("Push API greška:", error);

    return NextResponse.json(
      {
        error: "Došlo je do greške kod slanja push obavijesti.",
      },
      { status: 500 }
    );
  }
}