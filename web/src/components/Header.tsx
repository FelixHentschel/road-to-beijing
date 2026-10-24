import { cn } from "@/lib/utils"
import { IMG } from "@/lib/brand"
import { DATA, SEX, SLUGS, deDate, getEvent, topThree, type Status } from "@/lib/data"

const TOTAL = SLUGS.length * 2 * DATA.maxPerNation

export function Hero({ embed }: { embed: boolean }) {
  return (
    <header className="night relative overflow-hidden">
      {/* Peking-Detail, übergroß und über den rechten Rand hinaus (Moodboard 10) */}
      <img
        src={IMG.hero}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12%] top-0 hidden h-full w-[68%] object-cover object-[30%_40%] md:block"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[66%] md:block" style={{ background: "linear-gradient(90deg, #0a0a0a 0%, #0a0a0a 66%, rgba(10,10,10,0) 100%)" }} />

      <div className="wrap relative pb-14 pt-6 md:pb-24 md:pt-8">
        <div className="flex items-start justify-between gap-6">
          {!embed ? (
            <a href="https://auslaufen-podcast.de" aria-label="Auslaufen Podcast, zur Startseite">
              <img src={IMG.wortmarkeDunkel} alt="Auslaufen Podcast" className="h-14 w-auto md:h-[76px]" />
            </a>
          ) : (
            <img src={IMG.wortmarkeDunkel} alt="Auslaufen Podcast" className="h-14 w-auto md:h-[76px]" />
          )}
          <span className="label pt-2 text-right">Stand {deDate(DATA.fetched)}</span>
        </div>

        <img src={IMG.hero} alt="" aria-hidden="true" className="mt-8 h-[220px] w-full object-cover object-[30%_45%] md:hidden" />

        <div className="mt-10 max-w-[640px] md:mt-24">
          <span className="label">WM-Quali Peking 2027 · 800 m bis Marathon</span>
          <h1 className="mb-0 mt-4 font-display text-[clamp(60px,11vw,136px)] font-extrabold uppercase leading-[0.84] tracking-[-0.03em]">
            Road to
            <br />
            Beijing
          </h1>
          <p className="mb-0 mt-7 max-w-[34ch] text-[clamp(19px,2vw,23px)] font-medium leading-[1.4] text-[#d4d7db]">
            Welche deutschen Läuferinnen und Läufer stehen auf der offiziellen Quali-Liste für die WM? Jede Woche neu, direkt von World Athletics.
          </p>
        </div>
      </div>

      {/* Ornamentband aus der Verbotenen Stadt als Abschluss */}
      <img src={IMG.band} loading="lazy" decoding="async" alt="" aria-hidden="true" className="relative block h-[64px] w-full object-cover object-bottom md:h-[96px]" />
    </header>
  )
}

const SQ: Record<Status, string> = {
  in: "bg-brand border-brand",
  near: "hatch border-ink",
  limit: "border-[#9aa0a6]",
  out: "border-[#9aa0a6]",
}

export function Square({ status, className }: { status: Status | "empty"; className?: string }) {
  return <i className={cn("block h-[24px] w-full max-w-[46px] border-2", status === "empty" ? "border-[#9aa0a6]" : SQ[status], className)} />
}

export function Overview({ cur, onPick }: { cur: { slug: string; sex: string }; onPick: (slug: string, sex: string) => void }) {
  return (
    <section className="wrap pt-16 md:pt-24" aria-labelledby="ov-h">
      <div className="grid items-stretch gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-14">
        {/* Die große Zahl auf dem roten Raster (Waldboden, Adobe-Halbton) */}
        <div className="relative flex min-h-[340px] flex-col justify-end overflow-hidden border-2 border-ink">
          <img src={IMG.rasterRot} loading="lazy" decoding="async" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          <div className="relative m-5 self-start bg-paper px-5 pb-4 pt-3 md:m-7">
            <span className="label text-dim">Deutsche Startplätze</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-[clamp(110px,15vw,184px)] font-extrabold leading-[0.8] tracking-[-0.04em]">{DATA.germanInField}</span>
              <span className="font-display text-[clamp(36px,4.5vw,56px)] font-extrabold text-dim">/{TOTAL}</span>
            </div>
            <p className="mb-0 mt-3 max-w-[26ch] text-base leading-snug">
              auf der offiziellen Liste qualifiziert. Höchstens drei pro Nation und Rennen.
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          <h2 id="ov-h" className="m-0 font-display text-[clamp(30px,4vw,44px)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em]">
            Zwölf Rennen, drei Plätze
          </h2>
          <p className="mb-6 mt-3 max-w-[48ch] text-dim">Ein Feld pro möglichem Startplatz. Antippen öffnet das Rennen.</p>
          <div className="grid grid-cols-[auto_repeat(2,minmax(0,1fr))] items-center gap-x-3 gap-y-1 border-t-[3px] border-ink pt-3">
            <span />
            <span className="label text-dim">Frauen</span>
            <span className="label text-dim">Männer</span>
            {SLUGS.map((s) => (
              <Row key={s} slug={s} cur={cur} onPick={onPick} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] text-dim">
            <Key status="in" text="qualifiziert" />
            <Key status="near" text="Nachrücker (Top 10)" />
            <Key status="out" text="nicht auf der Liste" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ slug, cur, onPick }: { slug: string; cur: { slug: string; sex: string }; onPick: (s: string, x: string) => void }) {
  return (
    <>
      <span className="whitespace-nowrap pr-2 text-[17px] font-semibold">{getEvent(slug, "women").label}</span>
      {(["women", "men"] as const).map((x) => {
        const e = getEvent(slug, x)
        const top = topThree(e)
        const n = top.filter((a) => a.status === "in").length
        const active = cur.slug === slug && cur.sex === x
        return (
          <button
            key={x}
            onClick={() => onPick(slug, x)}
            aria-current={active}
            aria-label={`${e.label} ${SEX[x]}: ${n} von 3 qualifiziert`}
            className={cn("flex min-h-11 items-center gap-1 border-2 border-transparent p-1.5 hover:border-[#9aa0a6]", active && "border-ink hover:border-ink")}
          >
            {[0, 1, 2].map((i) => (
              <Square key={i} status={top[i] ? top[i].status : "empty"} />
            ))}
          </button>
        )
      })}
    </>
  )
}

function Key({ status, text }: { status: Status; text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Square status={status} className="h-3.5 w-5 border-[1.5px]" />
      {text}
    </span>
  )
}
