/*  Il recap della giornata: cosa conviene ripassare, cosa scade, cosa è
 *  rimasto a metà, e cosa hai fatto.
 *
 *  Una cosa va detta subito perché spiega la forma di tutto il file.
 *  I compiti e le registrazioni NON stanno nell'indice: vivono dentro
 *  il documento Yjs della pagina a cui appartengono — è la scelta che
 *  li fa sincronizzare e cancellare insieme alla pagina, e va bene
 *  così. Ma vuol dire che per sapere «quali compiti ho in tutte le
 *  materie» bisogna aprire ogni pagina una volta. Si fa qui, in un giro
 *  solo, e il risultato si tiene da parte: la schermata Oggi la si apre
 *  molte volte al giorno, il giro lo si fa una.
 *
 *  Gli esami, le pagine e gli esiti dei quiz invece stanno nell'indice,
 *  che è già in memoria: quelli non costano niente. */

import { mappaDocumenti, mappaQuaderni, soloPagine } from '../documento/archivio'
import { leggiDocumento } from '../documento/leggi'
import type { Documento, Esame, Quaderno } from '../documento/tipi'
import type { Colore } from '../stili/colori'
import { compitiDi, type Compito } from '../compiti/deposito'
import { leggiRegistrazioni } from '../registrazione/registrazione'
import { daRipassare, type Esito } from '../ripasso/risultati'
import { mancano, prossimoEsame } from '../lib/esami'

/** Il perché un ripasso è consigliato: serve a scriverlo, non a ordinare. */
export type Motivo = 'mai' | 'storto' | 'vecchio'

export type QuizConsigliato = {
  quadernoId: string
  materia: string
  colore: Colore
  pagine: number
  motivo: Motivo
  esito: Esito | undefined
  esame: Esame | null
  /** giorni al prossimo esame, se c'è: è quello che decide l'ordine */
  giorni: number | null
}

export type Scadenza =
  | { tipo: 'esame'; chiave: string; quadernoId: string; materia: string; colore: Colore; testo: string; data: string; giorni: number }
  | { tipo: 'compito'; chiave: string; quadernoId: string; materia: string; colore: Colore; testo: string; data?: string; giorni: number | null; documentoId: string; pagina: string }

export type DaIntegrare = {
  chiave: string
  documentoId: string
  pagina: string
  materia: string
  colore: Colore
  quante: number
  /** minuti di parlato ancora fuori dagli appunti */
  minuti: number
}

export type Fatto = {
  pagine: { id: string; titolo: string; materia: string; colore: Colore }[]
  lezioni: number
  minuti: number
  quiz: { chiave: string; giuste: number; totale: number }[]
}

export type Oggi = {
  quiz: QuizConsigliato[]
  scadenze: Scadenza[]
  daIntegrare: DaIntegrare[]
  fatto: Fatto
  /** quando è stato fatto il giro sulle pagine */
  raccolto: number
}

const GIORNO = 86_400_000

function èOggi(quando: number) {
  const a = new Date(quando)
  const b = new Date()
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const senzaNome = (s: string, vuoto: string) => s.trim() || vuoto

/*  Il giro sulle pagine. Torna solo quello che non si può sapere
 *  dall'indice: i compiti e le registrazioni. */
type DaiDocumenti = {
  compiti: { documento: Documento; compito: Compito }[]
  daIntegrare: { documento: Documento; id: string; quante: number; secondi: number }[]
  lezioniDiOggi: { inizio: number; durata: number }[]
}

async function giraLePagine(pagine: Documento[]): Promise<DaiDocumenti> {
  const fuori: DaiDocumenti = { compiti: [], daIntegrare: [], lezioniDiOggi: [] }
  for (const d of pagine) {
    try {
      await leggiDocumento(d.id, (doc) => {
        for (const c of compitiDi(doc)) {
          if (!c.fatto) fuori.compiti.push({ documento: d, compito: c })
        }
        for (const r of leggiRegistrazioni(doc)) {
          const parlato = r.segmenti.reduce((n, s) => Math.max(n, s.fine), 0)
          if (r.fine !== null && r.segmenti.length > 0 && r.integrata === null && r.insieme === null) {
            fuori.daIntegrare.push({ documento: d, id: r.id, quante: r.segmenti.length, secondi: parlato })
          }
          if (èOggi(r.inizio)) fuori.lezioniDiOggi.push({ inizio: r.inizio, durata: parlato })
        }
      })
    } catch {
      // una pagina che non si apre non deve far sparire il resto del recap
    }
  }
  return fuori
}

export async function raccogliOggi(esiti: Map<string, Esito>): Promise<Oggi> {
  const quaderni = [...mappaQuaderni.values()]
  const perId = new Map(quaderni.map((q) => [q.id, q]))
  const pagine = [...mappaDocumenti.values()].filter(soloPagine)
  const dai = await giraLePagine(pagine)

  const materia = (q: Quaderno | undefined) => senzaNome(q?.nome ?? '', 'Senza nome')
  const colore = (q: Quaderno | undefined): Colore => q?.colore ?? 'blu'

  /*  ── I ripassi consigliati ──────────────────────────────────
   *  Uno per materia, non uno per argomento: per sapere quali
   *  argomenti ci sono bisognerebbe rileggere tutte le pagine di
   *  quella materia e spezzarle in titoli, e sarebbe un secondo giro
   *  molto più caro di questo. Per un recap quotidiano la materia è
   *  comunque l'unità giusta — «oggi rivedi Materiali», non «oggi
   *  rivedi il paragrafo tre». */
  const quiz: QuizConsigliato[] = []
  for (const q of quaderni) {
    const quante = pagine.filter((d) => d.quadernoId === q.id).length
    if (!quante) continue                      // non c'è niente su cui fare domande
    const esito = esiti.get(`materia:${q.id}`)
    if (!daRipassare(esito)) continue
    const esame = prossimoEsame(q)
    quiz.push({
      quadernoId: q.id,
      materia: materia(q),
      colore: colore(q),
      pagine: quante,
      motivo: !esito ? 'mai' : esito.giuste / esito.totale < 0.7 ? 'storto' : 'vecchio',
      esito,
      esame,
      giorni: esame ? mancano(esame.data) : null,
    })
  }
  /*  L'esame vicino viene prima di tutto: è la cosa che cambia le
   *  giornate. Poi quello che non hai mai ripassato, poi quello andato
   *  storto, poi il tempo passato. */
  const peso: Record<Motivo, number> = { mai: 0, storto: 1, vecchio: 2 }
  quiz.sort((a, b) => {
    const ea = a.giorni ?? Infinity
    const eb = b.giorni ?? Infinity
    if (ea !== eb) return ea - eb
    if (peso[a.motivo] !== peso[b.motivo]) return peso[a.motivo] - peso[b.motivo]
    return (a.esito?.quando ?? 0) - (b.esito?.quando ?? 0)
  })

  /*  ── Le scadenze: esami e compiti nella stessa fila ─────────
   *  Mescolati apposta. Sono due tabelle diverse nel codice ma la
   *  stessa cosa nella testa di chi studia: roba con una data. */
  const scadenze: Scadenza[] = []
  for (const q of quaderni) {
    for (const e of q.esami ?? []) {
      if (!e.data) continue
      const giorni = mancano(e.data)
      if (giorni < 0) continue
      scadenze.push({
        tipo: 'esame', chiave: `esame:${q.id}:${e.id}`, quadernoId: q.id,
        materia: materia(q), colore: colore(q),
        testo: senzaNome(e.nome, 'Esame'), data: e.data, giorni,
      })
    }
  }
  for (const { documento, compito } of dai.compiti) {
    const q = perId.get(documento.quadernoId)
    scadenze.push({
      tipo: 'compito', chiave: `compito:${documento.id}:${compito.id}`,
      quadernoId: documento.quadernoId, materia: materia(q), colore: colore(q),
      testo: compito.testo, data: compito.data,
      giorni: compito.data ? mancano(compito.data) : null,
      documentoId: documento.id, pagina: senzaNome(documento.titolo, 'Senza titolo'),
    })
  }
  /*  Per data; chi non ce l'ha va in fondo — non ha una scadenza,
   *  quindi oggi non è il suo giorno. */
  scadenze.sort((a, b) => {
    const ga = a.giorni ?? Infinity
    const gb = b.giorni ?? Infinity
    if (ga !== gb) return ga - gb
    return a.tipo === b.tipo ? 0 : a.tipo === 'esame' ? -1 : 1
  })

  /*  ── Le lezioni registrate che non sono ancora negli appunti ── */
  const daIntegrare: DaIntegrare[] = dai.daIntegrare.map(({ documento, id, quante, secondi }) => {
    const q = perId.get(documento.quadernoId)
    return {
      chiave: `lezione:${documento.id}:${id}`,
      documentoId: documento.id,
      pagina: senzaNome(documento.titolo, 'Senza titolo'),
      materia: materia(q), colore: colore(q),
      quante, minuti: Math.round(secondi / 60),
    }
  })
  daIntegrare.sort((a, b) => b.minuti - a.minuti)

  /*  ── Quello che hai fatto oggi ─────────────────────────────── */
  const fatto: Fatto = {
    pagine: pagine
      .filter((d) => èOggi(d.modificato))
      .sort((a, b) => b.modificato - a.modificato)
      .map((d) => {
        const q = perId.get(d.quadernoId)
        return { id: d.id, titolo: senzaNome(d.titolo, 'Senza titolo'), materia: materia(q), colore: colore(q) }
      }),
    lezioni: dai.lezioniDiOggi.length,
    minuti: Math.round(dai.lezioniDiOggi.reduce((n, l) => n + l.durata, 0) / 60),
    quiz: [...esiti.entries()]
      .filter(([, e]) => èOggi(e.quando))
      .sort((a, b) => b[1].quando - a[1].quando)
      .map(([chiave, e]) => ({ chiave, giuste: e.giuste, totale: e.totale })),
  }

  return { quiz, scadenze, daIntegrare, fatto, raccolto: Date.now() }
}

/*  Il giro sulle pagine costa: si tiene il risultato finché non passa
 *  un quarto d'ora o finché non lo si chiede di nuovo a mano. */
let tenuto: Oggi | null = null
const SCADE = 15 * 60_000

export function dimenticaOggi() { tenuto = null }

export async function leggiOggi(esiti: Map<string, Esito>, daCapo = false): Promise<Oggi> {
  if (!daCapo && tenuto && Date.now() - tenuto.raccolto < SCADE) return tenuto
  tenuto = await raccogliOggi(esiti)
  return tenuto
}

/** Quanto manca, detto corto: «oggi», «domani», «fra 3 g», «3 g fa». */
export function quanto(giorni: number | null): string | null {
  if (giorni === null) return null
  if (giorni === 0) return 'oggi'
  if (giorni === 1) return 'domani'
  if (giorni > 1) return `fra ${giorni} g`
  return `${-giorni} g fa`
}

export const giorniDa = (quando: number) => Math.floor((Date.now() - quando) / GIORNO)
