import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { IMG } from "@/lib/brand"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DATA, PATH, SEX, SLUGS, STATUS, deDate, deWindow, detail, getEvent, lastName, margin, nm,
  type Athlete, type RaceEvent, type Path,
} from "@/lib/data"

const FIELD_W = 70 // Anteil der Bahn für das WM-Feld, Rest = Nachrückerliste

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

const SEG: { key: Path[]; cls: string; label: string }[] = [
  { key: ["wildcard", "kontinent", "label"], cls: "seg-other", label: "Wildcard, Titel, Label-Rennen" },
  { key: ["norm"], cls: "bg-[#f2f3f4]", label: "Norm" },
  { key: ["ranking"], cls: "bg-brand", label: "World Ranking" },
]

function waitCap(e: RaceEvent) {
  const max = Math.max(0, ...e.athletes.filter((a) => !a.pos && a.wait).map((a) => a.wait!))
  return max <= 20 ? 20 : max <= 40 ? 40 : 60
}

function posOf(a: Athlete, e: RaceEvent, cap: number): number | null {
  if (a.pos) return ((a.pos - 0.5) / e.fieldSize) * FIELD_W
  if (a.wait) return FIELD_W + (Math.min(a.wait, cap) / cap) * (100 - FIELD_W) - 1.5
  return null
}

/* Die Bahn: links das WM-Feld, rechts hinter der roten Quali-Linie die Nachrücker auf den echten Rissen im Tartan */
function Lane({ e }: { e: RaceEvent }) {
  const cap = waitCap(e)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(false)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [e.slug, e.sex])
  let acc = 0
  const segs = SEG.map((s) => {
    const n = s.key.reduce((t, k) => t + (e.paths[k] || 0), 0)
    const left = (acc / e.fieldSize) * FIELD_W
    acc += n
    return { ...s, n, left, width: (n / e.fieldSize) * FIELD_W }
  }).filter((s) => s.n > 0)
  const empty = e.fieldSize - e.assigned
  const placed = e.athletes.map((a) => ({ a, x: posOf(a, e, cap) })).filter((p) => p.x !== null) as { a: Athlete; x: number }[]
  const label = `Startliste ${e.label} ${SEX[e.sex]}: ${e.assigned} von ${e.fieldSize} Plätzen vergeben. ` +
    (placed.length ? placed.slice(0, 3).map(({ a }) => `${nm(a.name)} ${a.pos ? "Position " + a.pos : "Nachrücker " + a.wait}`).join(", ") : "Keine Deutschen auf der Liste.")

  return (
    <div className="mt-10">
      <div className={cn("relative", placed.length ? "pt-[118px]" : "pt-10")} role="img" aria-label={label}>
        <div className="relative h-[72px] bg-night">
          {segs.map((s) => (
            <div key={s.label} className={cn("absolute inset-y-[14px]", s.cls)} style={{ left: `${s.left}%`, width: `${s.width}%` }} />
          ))}
          {empty > 0 && (
            <div
              className="absolute inset-y-[14px] border-2 border-dashed border-[#9aa0a6]"
              style={{ left: `${(e.assigned / e.fieldSize) * FIELD_W}%`, width: `${(empty / e.fieldSize) * FIELD_W}%` }}
            />
          )}
          <div className="absolute inset-y-0 right-0 overflow-hidden" style={{ left: `${FIELD_W}%` }}>
            <img src={IMG.risse} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-90" />
          </div>
          {/* Quali-Linie */}
          <div className="absolute -bottom-9 -top-3 w-[5px] -translate-x-1/2 bg-brand" style={{ left: `${FIELD_W}%` }}>
            <span className="absolute right-3 top-full -mt-6 whitespace-nowrap text-sm font-bold uppercase tracking-[0.08em] text-ink">Feld {e.fieldSize}</span>
            <span className="absolute left-3 top-full -mt-6 whitespace-nowrap text-sm font-bold uppercase tracking-[0.08em] text-ink">Nachrücker</span>
          </div>
        </div>
        {placed.map(({ a, x }, i) => {
          const major = i < 3
          const lvl = major ? [74, 40, 6][i] : 0
          const edge = x < 10 ? "items-start" : x > 90 ? "items-end" : "items-center"
          return (
            <div
              key={a.name}
              className={cn("pointer-events-none absolute bottom-[72px] flex w-0 flex-col transition-[left] duration-700", edge)}
              style={{ left: `${ready ? x : 0}%`, transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" }}
            >
              {major && (
                <>
                  <span className={cn("bib whitespace-nowrap px-2.5 pb-1 pt-2.5 text-[15px] font-semibold leading-tight", x < 10 && "-ml-4", x > 90 && "-mr-4")}>
                    <b className="mr-1.5 font-extrabold">{a.pos ?? `N${a.wait}`}</b>
                    {lastName(a.name)}
                  </span>
                  <span className="w-0.5 bg-ink" style={{ height: lvl + 10 }} />
                </>
              )}
              <span className={cn("-mb-2 h-4 w-4 rounded-full border-[3px] border-ink bg-paper", !major && "-mb-1.5 h-3 w-3 border-2 bg-ink")} />
            </div>
          )
        })}
      </div>
      <div className="mt-14 flex flex-wrap justify-between gap-x-6 gap-y-2 text-[15px] text-dim">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {SEG.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-2">
              <i className={cn("inline-block h-3.5 w-5 border border-ink", s.cls)} />
              {s.label}
            </span>
          ))}
          {empty > 0 && (
            <span className="inline-flex items-center gap-2">
              <i className="inline-block h-3.5 w-5 border-2 border-dashed border-[#9aa0a6]" />
              noch frei ({empty})
            </span>
          )}
        </div>
        <span>Nachrücker bis N{cap}{e.athletes.some((a) => !a.pos && (a.wait || 0) > cap) ? "+" : ""}</span>
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
      <p className="m-0"><strong className="text-ink">Nachrücker:</strong> steht auf der offiziellen Nachrückerliste hinter der Quali-Linie. Bis Platz {DATA.near} gilt das hier als knapp dahinter.</p>
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
