import { useEffect, useState } from "react"
import { Hero, Overview } from "@/components/Header"
import { IMG } from "@/lib/brand"
import { Focus } from "@/components/Focus"
import { Nations } from "@/components/Nations"
import { DATA, SLUGS, getEvent } from "@/lib/data"

type Sex = "women" | "men"
const SEX_TOKEN: Record<Sex, string> = { women: "frauen", men: "maenner" }

// Direkter Link pro Disziplin, z. B. #marathon-maenner
function fromHash(): { slug: string; sex: Sex } | null {
  const m = window.location.hash.slice(1).toLowerCase().match(/^([a-z0-9]+)-(frauen|maenner)$/)
  if (!m || !SLUGS.includes(m[1])) return null
  return { slug: m[1], sex: m[2] === "frauen" ? "women" : "men" }
}

// Eingebettet im Shop (iframe): Höhe an die Shopify-Seite melden, damit kein innerer Scrollbalken entsteht
const EMBED = (() => {
  try { return window.self !== window.top } catch { return true }
})()

export default function App() {
  const [cur, setCur] = useState<{ slug: string; sex: Sex }>(() => fromHash() ?? { slug: "800m", sex: "women" })
  const [nat, setNat] = useState("GER")
  const pick = (slug: string, sex: string) => setCur({ slug, sex: sex as Sex })
  const e = getEvent(cur.slug, cur.sex)

  useEffect(() => {
    const token = `#${cur.slug}-${SEX_TOKEN[cur.sex]}`
    if (window.location.hash !== token) history.replaceState(null, "", token)
    if (EMBED) window.parent.postMessage({ type: "rtb-hash", hash: token }, "*")
  }, [cur])

  useEffect(() => {
    const onHash = () => { const h = fromHash(); if (h) setCur(h) }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    if (!EMBED) return
    const send = () => window.parent.postMessage({ type: "rtb-height", height: document.documentElement.scrollHeight }, "*")
    const ro = new ResizeObserver(send)
    ro.observe(document.body)
    send()
    return () => ro.disconnect()
  }, [])

  return (
    <div className="pb-0">
      <Hero embed={EMBED} />
      <Overview cur={cur} onPick={pick} />
      <Focus cur={cur} onPick={pick} />
      <Nations e={e} nat={nat} onNat={setNat} />
      <footer className="night mt-24 md:mt-32">
        <img src={IMG.band} alt="" aria-hidden="true" className="block h-[56px] w-full scale-y-[-1] object-cover object-bottom md:h-[80px]" />
        <div className="wrap grid gap-10 py-12 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
          <img src={IMG.pillDunkel} alt="Auslaufen Podcast" className="h-[120px] w-auto" />
          <div className="dim flex flex-col gap-2 text-[15px]">
            <span>
              Quelle der Quali-Daten: <a href={DATA.source} target="_blank" rel="noopener" className="text-nightfg underline">Road to Beijing 27, World Athletics</a>. Die Liste wird mit dem World Ranking aktualisiert, endgültig ist der Stand vom 25.08.2027 (Marathon 05.05.2027). Hinweise auf Deutsche außerhalb der Liste stammen aus dem World Ranking und zählen nicht für die Quali.
            </span>
            <span>Nominierungsregeln aus Verbandsdokumenten. Für Kenia, Äthiopien, Uganda und Marokko aus Presseberichten, für die USA aus Sekundärquellen.</span>
            {!EMBED && (
              <>
                <span>
                  Ein Projekt des <a href="https://auslaufen-podcast.de" className="text-nightfg underline">Auslaufen Podcasts</a> von Max Thorwirth und Felix Hentschel. Alle Angaben ohne Gewähr, die Nominierung entscheiden die Verbände.
                </span>
                <span className="mt-2 flex gap-5">
                  <a href="https://auslaufen-podcast.de/policies/legal-notice" className="min-h-11 py-2 text-nightfg underline">Impressum</a>
                  <a href="https://auslaufen-podcast.de/policies/privacy-policy" className="min-h-11 py-2 text-nightfg underline">Datenschutz</a>
                </span>
              </>
            )}
            {EMBED && <span>Alle Angaben ohne Gewähr, die Nominierung entscheiden die Verbände.</span>}
          </div>
        </div>
      </footer>
    </div>
  )
}
