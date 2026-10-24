import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NAT, NATIONS, SEX, type RaceEvent } from "@/lib/data"
import { IMG } from "@/lib/brand"

const SRC: Record<string, string> = { offiziell: "Offizielles Dokument", "sekundär": "Sekundärquellen", presse: "Presseberichte" }
// Nur Schwarz, Rot und Grau: ja = gefüllt, bedingt/weicher = Kontur, nein/härter = Rot mit weißer Schrift, keine = grau
const VCLS: Record<string, string> = { ja: "bg-ink text-paper border-ink", bedingt: "border-ink text-ink", weicher: "border-ink text-ink", nein: "bg-brand text-onbrand border-brand", "härter": "bg-brand text-onbrand border-brand", keine: "border-dim text-dim" }

export function Nations({ e, nat, onNat }: { e: RaceEvent; nat: string; onNat: (n: string) => void }) {
  const n = NAT[nat]
  const stand = n.stand === "offen" ? "Regeln 2027 noch nicht veröffentlicht" : n.stand.startsWith("2027") ? "Regeln für Peking 2027 veröffentlicht" : "Regeln 2027 noch offen"
  return (
    <section className="relative mt-24 overflow-hidden md:mt-32" aria-labelledby="nat-h">
      {/* Weidenzweige vor dem Eckturm, übergroß über die Ecke (Peking-Detail) */}
      <img src={IMG.zweige} loading="lazy" decoding="async" alt="" aria-hidden="true" className="pointer-events-none absolute right-[-8%] top-[3px] h-[220px] w-[90%] object-cover object-[60%_30%] mix-blend-multiply dark:hidden md:h-[360px] md:w-[66%]" style={{ maskImage: "linear-gradient(90deg, transparent, #000 30%, #000 85%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 30%, #000 85%, transparent)" }} />
      <div className="wrap relative">
      <div className="mb-[200px] h-[3px] bg-ink md:mb-[320px]" aria-hidden="true" />
      <span className="label text-dim">Nominierung</span>
      <h2 id="nat-h" className="m-0 mb-4 mt-3 font-display text-[clamp(40px,6.5vw,80px)] font-extrabold uppercase leading-[0.88] tracking-[-0.025em]">
        Wie nominieren
        <br />
        die anderen?
      </h2>
      <p className="mb-10 mt-0 max-w-[56ch] text-lg text-dim">
        Jede Nation füllt ihre drei Plätze nach eigenen Regeln: Trials, strengere Normen oder freies Ermessen. Wer ein Ticket nicht annimmt, macht den Platz für die Nachrückerliste frei.
      </p>

      <div className="grid items-start gap-9 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <h3 className="m-0 mb-1 font-display text-[24px] font-extrabold leading-tight">Wer füllt das Feld? {e.label} {SEX[e.sex]}</h3>
          <p className="mb-3.5 mt-0 text-sm text-dim">
            Ein Kästchen pro Person laut offizieller Liste. {e.blocked > 0 ? `${e.blocked} weitere stünden drin, scheitern aber am Limit ihres Landes.` : "Aktuell scheitert niemand am Limit seines Landes."}
          </p>
          <div className="flex flex-col">
            {e.nations.map((x) => {
              const has = !!NAT[x.nat]
              return (
                <button
                  key={x.nat}
                  disabled={!has}
                  onClick={() => onNat(x.nat)}
                  aria-pressed={x.nat === nat}
                  aria-label={`${x.nat}: ${x.in} qualifiziert${x.blocked ? `, ${x.blocked} am Limit gescheitert` : ""}${has ? ", Regeln anzeigen" : ""}`}
                  className={cn(
                    "grid w-full grid-cols-[48px_minmax(0,1fr)_44px] items-center gap-2.5 border-l-[3px] border-transparent px-1 py-1.5 text-left enabled:hover:bg-well disabled:cursor-default",
                    x.nat === nat && "border-brand bg-well",
                  )}
                >
                  <span className="text-[15px] font-extrabold">{x.nat}</span>
                  <span className="flex flex-wrap gap-[3px]">
                    {Array.from({ length: x.in }, (_, i) => <i key={"a" + i} className="h-3 w-3 bg-ink" />)}
                    {Array.from({ length: x.blocked }, (_, i) => <i key={"b" + i} className="h-3 w-3 bg-brand" />)}
                  </span>
                  <span className="text-right text-sm text-dim">{x.in}{x.blocked ? `+${x.blocked}` : ""}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-dim">
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 bg-ink" />qualifiziert</span>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 bg-brand" />am Nationen-Limit gescheitert</span>
          </div>
        </div>

        <div>
          <div className="mb-3.5 flex flex-wrap gap-1.5" role="group" aria-label="Nation wählen">
            {NATIONS.map((x) => (
              <button
                key={x.nat}
                onClick={() => onNat(x.nat)}
                aria-pressed={x.nat === nat}
                className={cn(
                  "min-h-11 border-2 border-[#9aa0a6] bg-paper px-3 py-1.5 text-[15px] font-extrabold hover:border-ink",
                  x.nat === nat && "border-ink bg-ink text-paper",
                )}
              >
                {x.nat}
              </button>
            ))}
          </div>
          <div className="night relative overflow-hidden p-6 md:p-8" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
              <h4 className="m-0 font-display text-[clamp(32px,4vw,44px)] font-extrabold uppercase leading-none">{n.name}</h4>
              <span className="dim text-sm">{n.verband}</span>
            </div>
            <div className="mb-5 mt-4 font-display text-[24px] font-extrabold leading-tight text-brand">{n.kurz}</div>
            <dl className="m-0 grid gap-x-4 gap-y-3 sm:grid-cols-[140px_minmax(0,1fr)]">
              {([["Meisterschaft", n.meisterschaft], ["Eigene Normen", n.normen], ["Ranking-Tickets", n.ranking], ["Marathon", n.marathon]] as const).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="dim text-sm font-semibold">{k}</dt>
                  <dd className="m-0 mb-2 text-base sm:mb-0">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="dim mt-6 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-nightline pt-4 text-sm">
              <span>{stand}</span>
              <span>Grundlage: {n.basis}</span>
              <span>{SRC[n.quelle]}</span>
              <a href={n.url} target="_blank" rel="noopener" className="text-nightfg underline">Quelle öffnen</a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-11">
        <h3 className="m-0 font-display text-[24px] font-extrabold leading-tight">Alle Regeln im Vergleich</h3>
        <div className="mt-3 overflow-x-auto">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow className="border-b-2 border-ink hover:bg-transparent">
                {["Nation", "Meisterschaft Pflicht", "Eigene Normen", "Ranking-Tickets", "Stand der Regeln"].map((h) => (
                  <TableHead key={h} className="label h-11 text-dim">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {NATIONS.map((x) => (
                <TableRow key={x.nat} className={cn("border-rule", x.nat === nat && "bg-well")}>
                  <TableCell className="text-[15px]">
                    <button onClick={() => onNat(x.nat)} className="min-h-11 font-semibold underline decoration-[#9aa0a6] underline-offset-4 hover:decoration-brand">{x.name}</button>
                  </TableCell>
                  {(["trials", "normen", "ranking"] as const).map((k) => (
                    <TableCell key={k}>
                      <span className={cn("inline-block border-2 px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.08em]", VCLS[x.flags[k]])}>{x.flags[k]}</span>
                    </TableCell>
                  ))}
                  <TableCell className="text-[15px]">{x.stand === "offen" ? "offen" : x.stand}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>
    </section>
  )
}
