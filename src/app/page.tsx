export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-100 pb-24">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <div className="text-2xl font-black tracking-tight text-red-600">
              MAESTRO
            </div>
            <div className="text-xs text-neutral-500">
              Učilište za obrazovanje odraslih
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
            IH
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-6">
        <p className="text-sm text-neutral-500">Dobro jutro,</p>
        <h1 className="text-2xl font-bold text-neutral-900">Ivan Horvat 👋</h1>

        <section className="mt-6 rounded-3xl bg-neutral-900 p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Sljedeće predavanje
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            Osnove računovodstva
          </h2>

          <div className="mt-5 space-y-2 text-sm text-neutral-200">
            <p>📅 Ponedjeljak, 14. rujna 2026.</p>
            <p>🕒 17:00 – 20:00</p>
            <p>📍 Učionica 2</p>
            <p>👩‍🏫 Ana Marić</p>
          </div>

          <button className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white">
            Prikaži cijeli raspored
          </button>
        </section>

        <section className="mt-7">
          <h2 className="text-lg font-bold text-neutral-900">
            Brzi pristup
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["📅", "Raspored"],
              ["🔔", "Obavijesti"],
              ["📋", "Ankete"],
              ["📄", "Dokumenti"],
            ].map(([icon, title]) => (
              <div key={title} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="text-2xl">{icon}</div>
                <p className="mt-3 font-semibold">{title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-lg font-bold text-neutral-900">
            Najnovije obavijesti
          </h2>

          <div className="mt-3 rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-semibold text-neutral-900">
              Promjena termina predavanja
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Predavanje u četvrtak počinje u 18:30 umjesto u 17:00.
            </p>
          </div>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          <button className="py-3 text-center text-red-600">
            <div>🏠</div>
            <div className="mt-1 text-xs font-semibold">Početna</div>
          </button>
          <button className="py-3 text-center text-neutral-500">
            <div>📅</div>
            <div className="mt-1 text-xs">Raspored</div>
          </button>
          <button className="py-3 text-center text-neutral-500">
            <div>🔔</div>
            <div className="mt-1 text-xs">Obavijesti</div>
          </button>
          <button className="py-3 text-center text-neutral-500">
            <div>👤</div>
            <div className="mt-1 text-xs">Profil</div>
          </button>
        </div>
      </nav>
    </main>
  );
}