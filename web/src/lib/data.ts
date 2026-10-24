import roadto from "@/data/roadto.json"
import nationsRaw from "@/data/nations.json"

export type Status = "in" | "near" | "limit" | "out"
export type Path = "norm" | "ranking" | "nachruecker" | "wildcard" | "kontinent" | "label" | "sonst"

export interface Athlete {
  name: string
  status: Status
  path: Path
  pos: number | null
  wait: number | null
  countryPos: number | null
  score: number | null
  result: string | null
  wrPlace: number | null
  label: string | null
  gap: number | null
  where: string | null
}
export interface RankedOnly { place: number; name: string; score: number }
export interface NationCount { nat: string; in: number; blocked: number }
export interface RaceEvent {
  slug: string
  sex: "women" | "men"
  label: string
  eventId: number
  url: string
  fieldSize: number
  standard: string
  window: string
  assigned: number
  paths: Partial<Record<Path, number>>
  cutScore: number | null
  listLength: number
  blocked: number
  athletes: Athlete[]
  notYet: RankedOnly[]
  nations: NationCount[]
}
export interface Dataset {
  fetched: string
  germanInField: number
  wrAsOf: string | null
  maxPerNation: number
  near: number
  events: RaceEvent[]
  source: string
}
export interface Nation {
  nat: string; name: string; verband: string; stand: string; basis: string; quelle: string
  meisterschaft: string; normen: string; ranking: string; marathon: string; kurz: string; url: string
  flags: { trials: string; normen: string; ranking: string }
}

export const DATA = roadto as Dataset
export const NATIONS = nationsRaw as Nation[]
export const NAT = Object.fromEntries(NATIONS.map((n) => [n.nat, n])) as Record<string, Nation>

export const SEX = { women: "Frauen", men: "Männer" } as const
export const SLUGS = [...new Set(DATA.events.map((e) => e.slug))]
export const getEvent = (slug: string, sex: string) => DATA.events.find((e) => e.slug === slug && e.sex === sex)!

export const STATUS: Record<Status, string> = {
  in: "Qualifiziert",
  near: "Nachrücker:in",
  limit: "Nationen-Limit",
  out: "Außerhalb",
}
export const PATH: Record<Path, string> = {
  norm: "Norm",
  ranking: "World Ranking",
  nachruecker: "Nachrückerliste",
  wildcard: "Wildcard",
  kontinent: "Kontinentaltitel",
  label: "Label-Marathon",
  sonst: "Sonstiges",
}

const MON: Record<string, string> = { JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06", JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12" }
export const deDate = (s: string) => {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`
  const p = s.trim().split(/\s+/)
  return p.length === 3 && MON[p[1].toUpperCase()] ? `${p[0].padStart(2, "0")}.${MON[p[1].toUpperCase()]}.${p[2]}` : s
}
export const deWindow = (w: string) => w.split("–").map((x) => deDate(x)).join(" bis ")

export const nm = (n: string) =>
  n.split(" ").map((w) => (w === w.toUpperCase() && w.length > 1 ? w.split("-").map((s) => s.charAt(0) + s.slice(1).toLowerCase()).join("-") : w)).join(" ")
export const lastName = (n: string) => {
  const p = nm(n).split(" ")
  return p[p.length - 1]
}

export const topThree = (e: RaceEvent) => e.athletes.slice(0, 3) // Reihenfolge der offiziellen Liste

export function detail(a: Athlete): string {
  const parts: string[] = []
  if (a.path === "norm" && a.result) parts.push(`${a.result} gelaufen`)
  else if (a.score) parts.push(`${a.score} Ranking-Punkte`)
  if (a.label) parts.push(a.label)
  if (a.wrPlace && a.path !== "norm") parts.push(`Platz ${a.wrPlace} im Ranking`)
  if (!parts.length) parts.push(PATH[a.path])
  return parts.join(", ")
}

export function margin(a: Athlete): string | null {
  if (a.status === "limit") return `Nr. ${a.countryPos} unter den Deutschen`
  if (a.gap == null || a.path === "norm") return null
  if (a.gap === 0) return "genau auf der Linie"
  if (a.gap > 0) return `${a.gap} Punkte Puffer`
  return `${-a.gap} Punkte bis zur Linie`
}
