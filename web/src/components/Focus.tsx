import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { IMG } from "@/lib/brand"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DATA, PATH, SEX, SLUGS, STATUS, deDate, deWindow, detail, getEvent, lastName, margin, nm,
  type Athlete, type RaceEvent,
} from "@/lib/data"


export function Focus({ cur, onPick }: { cur: { slug: string; sex: "women" | "men" }; onPick: (s: string, x: string) => void }) {
  const e = getEvent(cur.slug, cur.sex)
  return (
    <section className="wrap mt-20 md:mt-28" aria-labelledby="ev-title">
      <div className="border-t-[3px] border-ink pt-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap gap-x-5 gap-y-1" role="group" aria-label="Disziplin">
            {SLUGS.map((s) => (
              <button
                key={s}
                onClick={() => onPick(s, cur.sex)}
                aria-pressed={s === cur.slug}
                className={cn(
                  "min-h-11 border-b-4 border-transparent py-1 font-display text-[clamp(18px,2.2vw,24px)] font-semibold text-dim hover:text-ink",
                  s === cur.slug && "border-brand font-extrabold text-ink",
                )}
              >
                {getEvent(s, "women").label}
              </button>
            ))}
          </div>
          <div className="flex border-2 border-ink" role="group" aria-label="Geschlecht">
            {(["women", "men"] as const).map((x, i) => (
              <button
                key={x}
                onClick={() => onPick(cur.slug, x)}
                aria-pressed={cur.sex === x}
                className={cn("h-11 px-5 text-base font-semibold hover:bg-well", i > 0 && "border-l-2 border-ink", cur.sex === x && "bg-ink text-paper hover:bg-ink")}
              >
                {SEX[x]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <h2 id="ev-title" className="m-0 font-display text-[clamp(44px,8vw,96px)] font-extrabold uppercase leading-[0.86] tracking-[-0.025em]">
          {e.label}
          <br />
          {SEX[e.sex]}
        </h2>
        <div className="flex flex-wrap gap-x-8 gap-y-3 pb-1">
          <Fact k="WM-Feld" v={String(e.fieldSize)} />
          <Fact k="Davon vergeben" v={String(e.assigned)} />
          <Fact k="WA-Norm" v={e.standard} />
        </div>
      </div>

      <Lane e={e} />

      <div className="mt-14 grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)]">
        <StartList e={e} />
        <Explainer e={e} />
      </div>
    </section>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col">
      <span className="label text-dim">{k}</span>
      <b className="font-display text-[28px] font-extrabold leading-tight">{v}</b>
    </div>
  )
}

/* Die Bahn von oben: Gelaufen wird von links nach rechts. Rechts der weißen Ziellinie stehen die Qualifizierten
   (Platz 1 ganz rechts), links die Nachrücker, die noch laufen (je näher an der Linie, desto knapper). */
const FIN = 58 // Position der Ziellinie in Prozent der Bahnbreite

function waitCap(e: RaceEvent) {
  const max = Math.max(0, ...e.athletes.filter((a) => !a.pos && a.wait).map((a) => a.wait!))
  return max <= 20 ? 20 : max <= 40 ? 40 : 60
}

function xOf(a: Athlete, e: RaceEvent, cap: number): number | null {
  if (a.pos) return FIN + 3 + (1 - (a.pos - 0.5) / e.fieldSize) * (100 - FIN - 9)
  if (a.wait) return FIN - 3 - (Math.min(a.wait, cap) / cap) * (FIN - 9)
  return null
}

function Runner() {
  // abstrakt: Schulterbalken und Kopfpunkt, dahinter zwei verwischte Nachbilder (Bewegung nach rechts)
  const body = (
    <>
      <rect x="50" y="22" width="14" height="36" rx="7" />
      <circle cx="73" cy="40" r="7" />
    </>
  )
  return (
    <svg viewBox="24 14 64 52" className="h-full w-full overflow-visible" aria-hidden="true">
      <g fill="#d4d7db" opacity="0.18" filter="url(#rtb-motion-strong)" transform="translate(-30 0)">{body}</g>
      <g fill="#d4d7db" opacity="0.4" filter="url(#rtb-motion)" transform="translate(-14 0)">{body}</g>
      <g fill="#d4d7db">{body}</g>
    </svg>
  )
}

function Lane({ e }: { e: RaceEvent }) {
  const cap = waitCap(e)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(false)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [e.slug, e.sex])
  const placed = e.athletes.map((a) => ({ a, x: xOf(a, e, cap) })).filter((p) => p.x !== null) as { a: Athlete; x: number }[]
  const limited = e.athletes.filter((a) => a.status === "limit").length
  const lanes = Math.max(3, placed.length)
  const label = `Bahn ${e.label} ${SEX[e.sex]}: ` +
    (placed.length
      ? placed.map(({ a }) => `${nm(a.name)} ${a.pos ? "Platz " + a.pos + ", qualifiziert" : "Nachrücker " + a.wait + ", noch nicht qualifiziert"}`).join("; ")
      : "Keine Deutschen auf der Liste.")

  return (
    <div className="mt-10">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id="rtb-motion" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="5 0.4" /></filter>
          <filter id="rtb-motion-strong" x="-80%" y="-20%" width="260%" height="140%"><feGaussianBlur stdDeviation="10 0.6" /></filter>
        </defs>
      </svg>
      <div className="relative mb-2 flex h-6 items-end justify-between gap-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-dim sm:text-sm">
        <span>← Noch nicht qualifiziert</span>
        <span className="absolute bottom-0 hidden -translate-x-1/2 font-extrabold text-ink sm:block" style={{ left: `${FIN}%` }}>Ziel</span>
        <span>Qualifiziert →</span>
      </div>
      <div
        className="relative overflow-hidden bg-brand"
        role="img"
        aria-label={label}
        style={{
          height: lanes * 64,
          backgroundImage: `repeating-linear-gradient(180deg, rgba(242,243,244,.92) 0 3px, transparent 3px 64px), url(${IMG.bahn})`,
          backgroundSize: "100% 64px, cover",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[rgba(242,243,244,.92)]" />
        <div className="absolute inset-y-0 w-3 -translate-x-1/2 border-x border-black/20 bg-white" style={{ left: `${FIN}%` }} />
        {placed.map(({ a, x }, i) => {
          const tagLeft = x > 78
          return (
            <div
              key={a.name}
              className="absolute flex h-[64px] items-center transition-[left]"
              style={{ top: i * 64, left: `${ready ? x : 2}%`, transitionDuration: "1100ms", transitionTimingFunction: "cubic-bezier(.16,1,.3,1)", transitionDelay: `${i * 90}ms` }}
            >
              <div className="relative h-[60px] w-[92px] -translate-x-1/2"><Runner /></div>
              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 whitespace-nowrap border-t-4 border-ink bg-[#f2f3f4] px-2 pb-0.5 pt-0.5 text-[13px] font-semibold leading-tight text-[#0a0a0a] sm:text-[15px]",
                  tagLeft ? "right-[130px] sm:right-[136px]" : "left-[44px]",
                )}
              >
                <b className="font-extrabold sm:mr-1">{a.pos ?? `N${a.wait}`}</b>
                <span className="hidden sm:inline">{lastName(a.name)}</span>
              </span>
            </div>
          )
        })}
        {!placed.length && (
          <div className="absolute inset-0 flex items-center px-5">
            <span className="bg-[#f2f3f4] px-3 py-1.5 text-[15px] font-semibold text-[#0a0a0a]">{e.sex === "women" ? "Noch keine Deutsche" : "Noch kein Deutscher"} auf der Liste</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 text-[15px] text-dim">
        <span>{e.assigned} von {e.fieldSize} Plätzen vergeben. Je weiter rechts, desto besser der Listenplatz.</span>
        <span>
          {limited > 0 ? `${limited} weitere Deutsche auf der Liste, aber am Nationen-Limit · ` : ""}Nachrücker bis N{cap}{e.athletes.some((a) => !a.pos && (a.wait || 0) > cap) ? "+" : ""}
        </span>
      </div>
    </div>
  )
}

const STAMP: Record<Athlete["status"], string> = {
  in: "bg-brand text-onbrand border-brand",
  near: "border-ink text-ink",
  limit: "border-dim text-dim",
  out: "border-dim text-dim",
}

function Row({ a, faded }: { a: Athlete; faded?: boolean }) {
  const m = margin(a)
  return (
    <div className={cn("grid grid-cols-[84px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-rule py-4 first:border-t-[3px] first:border-t-ink sm:grid-cols-[84px_minmax(0,1fr)_auto]", faded && "opacity-90")}>
      <div className="bib bib-pins flex h-[64px] items-center justify-center pt-1.5 font-display text-[32px] font-extrabold leading-none">
        {a.pos ?? (a.wait ? `N${a.wait}` : "–")}
      </div>
      <div className="min-w-0">
        <strong className="block text-[21px] font-semibold leading-tight">{nm(a.name)}</strong>
        <small className="block text-[15px] text-dim">{PATH[a.path]}: {detail(a)}</small>
      </div>
      <div className="col-start-2 sm:col-start-auto sm:text-right">
        <span className={cn("inline-block -rotate-2 whitespace-nowrap border-2 px-2.5 py-0.5 text-[13px] font-extrabold uppercase tracking-[0.1em]", STAMP[a.status])}>{STATUS[a.status]}</span>
        {m && <small className="mt-1.5 block text-sm text-dim">{m}</small>}
      </div>
    </div>
  )
}

function StartList({ e }: { e: RaceEvent }) {
  const top = e.athletes.slice(0, 3)
  const rest = e.athletes.slice(3, 8)
  const start = deDate(e.window.split("–")[0].trim())
  return (
    <div>
      <h3 className="label mb-3 mt-0 text-dim">Deutsche auf der Liste</h3>
      {top.length ? (
        <>
          <div className="flex flex-col" aria-live="polite">
            {top.map((a) => <Row key={a.name} a={a} />)}
          </div>
          {rest.length > 0 && (
            <Collapsible className="mt-3">
              <CollapsibleTrigger className="group flex min-h-11 items-center gap-1.5 py-2 font-semibold text-dim hover:text-ink">
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" strokeWidth={2.5} />
                Weitere Deutsche auf der Liste ({rest.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col">
                {rest.map((a) => <Row key={a.name} a={a} faded />)}
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      ) : (
        <div className="border-t-[3px] border-ink py-6" aria-live="polite">
          <p className="m-0 text-[24px] font-extrabold leading-tight">{e.sex === "women" ? "Noch keine Deutsche" : "Noch kein Deutscher"} auf der Quali-Liste.</p>
          <p className="mb-0 mt-2 max-w-[52ch] text-dim">
            Gezählt werden nur Leistungen ab dem {start}. Wer seitdem kein gewertetes Rennen über {e.label} hatte, taucht noch nicht auf.
          </p>
        </div>
      )}
      <NotYet e={e} start={start} />
    </div>
  )
}

function NotYet({ e, start }: { e: RaceEvent; start: string }) {
  if (!e.notYet?.length) return null
  return (
    <div className="mt-12">
      <h3 className="m-0 font-display text-[24px] font-extrabold leading-tight">Im World Ranking, aber noch nicht auf der Liste</h3>
      <p className="mb-4 mt-1.5 max-w-[56ch] text-[15px] text-dim">
        Ihre Ranking-Punkte stammen meist aus Rennen vor dem {start}. Mit einem gewerteten Rennen im Quali-Zeitraum können sie auf die Liste kommen. Zusatzinfo aus dem World Ranking{DATA.wrAsOf ? ` (Stand ${deDate(DATA.wrAsOf)})` : ""}, zählt nicht für die Quali.
      </p>
      <ul className="m-0 grid list-none gap-x-8 p-0 sm:grid-cols-2">
        {e.notYet.map((a) => (
          <li key={a.name} className="flex items-baseline gap-3 border-t border-rule py-3">
            <span className="w-16 shrink-0 text-[17px] font-extrabold text-dim">#{a.place}</span>
            <span className="min-w-0">
              <span className="block font-semibold leading-tight">{nm(a.name)}</span>
              <span className="block text-sm text-dim">{a.score} Punkte im World Ranking</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Explainer({ e }: { e: RaceEvent }) {
  return (
    <div className="flex flex-col gap-3.5 text-base text-dim">
      <h3 className="label m-0 mb-1 text-dim">So liest du die Liste</h3>
      <p className="m-0"><strong className="text-ink">Qualifiziert:</strong> World Athletics führt die Person auf der offiziellen Liste als qualifiziert, über Norm, World Ranking oder Wildcard.</p>
      <p className="m-0"><strong className="text-ink">Nachrücker:</strong> steht auf der offiziellen Nachrückerliste und läuft auf der Bahn noch links vor der Ziellinie. Bis Platz {DATA.near} gilt das hier als knapp dahinter.</p>
      <p className="m-0"><strong className="text-ink">Nationen-Limit:</strong> pro Land starten höchstens {DATA.maxPerNation}, mit Wildcard vier.</p>
      <p className="m-0"><strong className="text-ink">Quali-Zeitraum:</strong> {deWindow(e.window)}. Was davor gelaufen wurde, zählt nicht.</p>
      <div className="night mt-2 px-5 py-4">
        <strong className="block font-display text-[19px] font-extrabold text-nightfg">Für Deutsche gilt eine weitere Hürde.</strong>
        <span className="mt-1 block text-[15px] text-[#d4d7db]">Der DLV verlangt zusätzlich eine eigene Leistungsnorm und meist die Teilnahme an der DM. Die Werte für 2027 sind noch nicht veröffentlicht.</span>
      </div>
      <a href={e.url} target="_blank" rel="noopener" className="min-h-11 py-2 font-semibold text-ink underline">Offizielle Liste bei World Athletics</a>
    </div>
  )
}
