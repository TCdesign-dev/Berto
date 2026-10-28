/*  Oggi: la prima schermata della giornata.
 *
 *  Non è un cruscotto di numeri. Risponde a quattro domande, nell'ordine
 *  in cui uno studente se le fa davvero:
 *
 *    cosa mi conviene ripassare · cosa scade · cosa è rimasto a metà ·
 *    cosa ho fatto
 *
 *  Le prime tre sono cose da fare, l'ultima è il consuntivo e sta in
 *  fondo apposta: aprire la giornata su quello che hai già fatto è un
 *  modo elegante per non cominciare.
 *
 *  Le sezioni ci sono sempre, anche vuote, e quando sono vuote lo
 *  dicono. È la differenza fra «oggi non hai scadenze» e una schermata
 *  dove la parola «scadenze» non compare: la seconda sembra un pezzo
 *  non fatto, e infatti la prima volta è sembrata proprio quello. La
 *  forma della schermata resta la stessa ogni giorno, e si impara dove
 *  guardare. Righe inventate per riempire, quelle no. */

import { useEffect, useState } from 'react'
import type { Quaderno } from '../documento/tipi'
import { argomentiDellaMateria } from '../ripasso/argomenti'
import { apriQuiz } from '../ripasso/statoQuiz'
import { daRipassare, useEsiti } from '../ripasso/risultati'
import { comeDetto, dataBreve } from '../lib/esami'
import { useLargo } from '../layout/larghezza'
import { Icona } from '../lib/Icona'
import { leggiOggi, quanto, giorniDa, type Fatto, type Oggi as Recap, type QuizConsigliato } from './raccolta'
import s from './Oggi.module.css'
import { locale, tr } from '../lingua/lingua'
import { Tr } from '../lingua/Tr'

const MOTIVI: Record<QuizConsigliato['motivo'], (q: QuizConsigliato) => string> = {
  mai: () => tr('mai ripassata'),
  storto: (q) => tr('l’ultima volta {g} su {t}', { g: q.esito!.giuste, t: q.esito!.totale }),
  vecchio: (q) => tr('ripassata {n} giorno fa | ripassata {n} giorni fa', { n: giorniDa(q.esito!.quando) }),
}

/*  «1 pagina toccata · 2 lezioni (84 min)». Gli zeri non si scrivono:
 *  una riga che dice «0 lezioni · 0 quiz» fa sembrare vuota una
 *  giornata in cui hai scritto. */
function consuntivo(f: Fatto): string {
  const parti: string[] = []
  if (f.pagine.length) parti.push(tr('{n} pagina toccata | {n} pagine toccate', { n: f.pagine.length }))
  if (f.lezioni) {
    parti.push(tr('{n} lezione | {n} lezioni', { n: f.lezioni })
      + (f.minuti > 0 ? tr(' ({n} min)', { n: f.minuti }) : ''))
  }
  if (f.quiz.length) parti.push(tr('{n} quiz', { n: f.quiz.length }))
  return parti.length ? parti.join(' · ') : tr('Ancora niente. La giornata è lunga.')
}

export function Oggi({ quaderni, onApri, onRipasso }: {
  quaderni: Quaderno[]
  onApri: (id: string) => void
  onRipasso: (quadernoId: string) => void
}) {
  const largo = useLargo()
  const esiti = useEsiti()
  const [recap, setRecap] = useState<Recap | null>(null)
  const [quizInCorso, setQuizInCorso] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    void leggiOggi(esiti).then((r) => { if (vivo) setRecap(r) })
    return () => { vivo = false }
    // gli esiti cambiano a ogni quiz fatto: il recap si rifà da sé
  }, [esiti])

  /*  Il quiz su tutta la materia vuole gli argomenti, e per averli
   *  bisogna rileggere le pagine: si fa al clic, non prima, perché
   *  sarebbe un giro caro per una riga che magari non premi. */
  async function fai(q: QuizConsigliato) {
    setQuizInCorso(q.quadernoId)
    try {
      const argomenti = await argomentiDellaMateria(q.quadernoId)
      if (!argomenti.length) { onRipasso(q.quadernoId); return }
      const ordinati = [...argomenti].sort((a, b) =>
        Number(daRipassare(esiti.get(b.chiave))) - Number(daRipassare(esiti.get(a.chiave))))
      apriQuiz({
        tipo: 'argomenti',
        titolo: tr('Tutta {materia}', { materia: q.materia }),
        materia: q.materia,
        argomenti: ordinati,
        chiaveEsito: `materia:${q.quadernoId}`,
      })
    } finally {
      setQuizInCorso(null)
    }
  }

  const giorno = new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className={s.pagina}>
      <div className={s.contenuto} data-largo={largo || undefined}>
        <h1 className={s.titolo}>{tr('Oggi')}</h1>
        <p className={s.giorno}>{giorno}</p>

        {!recap && <p className={s.attesa}>{tr('Guardo com’è messa la giornata…')}</p>}

        {recap && !quaderni.length && (
          <p className={s.sereno}>
            <Icona nome="accetta" dimensione={16} />
            {tr('Non c’è ancora niente. Crea una materia e comincia a prendere appunti.')}
          </p>
        )}

        {/* ── da ripassare ─────────────────────────────────────── */}
        {recap && !!quaderni.length && (
          <section className={s.sezione}>
            <h2 className={s.etichetta}>{tr('Da ripassare')}</h2>
            {!recap.quiz.length && <p className={s.niente}>{tr('Tutto ripassato di recente.')}</p>}
            {recap.quiz.map((q) => (
              <div key={q.quadernoId} className={s.riga}>
                <span className={s.pallino} data-colore={q.colore} />
                <button className={s.nome} onClick={() => onRipasso(q.quadernoId)}>{q.materia}</button>
                <span className={s.nota}>
                  {MOTIVI[q.motivo](q)}
                  {q.esame && q.giorni !== null && (
                    <> · <b className={q.giorni <= 7 ? s.vicino : undefined}>{tr('esame {quando}', { quando: comeDetto(q.esame.data) })}</b></>
                  )}
                </span>
                <button className={s.azione} onClick={() => void fai(q)} disabled={quizInCorso === q.quadernoId}>
                  {quizInCorso === q.quadernoId ? tr('preparo…') : tr('Fai il quiz')}
                </button>
              </div>
            ))}
          </section>
        )}

        {/* ── in scadenza ──────────────────────────────────────── */}
        {recap && !!quaderni.length && (
          <section className={s.sezione}>
            <h2 className={s.etichetta}>{tr('In scadenza')}</h2>
            {!recap.scadenze.length && (
              <p className={s.niente}>
                <Tr frase="Niente in scadenza. Gli esami si scrivono nella <b>scheda della materia</b>; i compiti li tira fuori l’integratore dalla lezione." classi={{ b: s.dove }} />
              </p>
            )}
            {recap.scadenze.map((d) => (
              <div key={d.chiave} className={s.riga}>
                <span className={s.pallino} data-colore={d.colore} />
                <span className={s.segno} aria-hidden>
                  <Icona nome={d.tipo === 'esame' ? 'esame' : 'compiti'} dimensione={14} />
                </span>
                {d.tipo === 'compito'
                  ? <button className={s.nome} onClick={() => onApri(d.documentoId)}>{d.testo}</button>
                  : <span className={s.nome}>{d.testo}</span>}
                <span className={s.nota}>
                  {d.materia}
                  {d.data && <> · {dataBreve(d.data)}</>}
                </span>
                {d.giorni !== null && (
                  <span className={`${s.quando} ${d.giorni <= 2 ? s.vicino : ''}`}>{quanto(d.giorni)}</span>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── lezioni rimaste fuori dagli appunti ──────────────── */}
        {recap && !!quaderni.length && (
          <section className={s.sezione}>
            <h2 className={s.etichetta}>{tr('Lezioni da integrare')}</h2>
            {!recap.daIntegrare.length && <p className={s.niente}>{tr('Nessuna lezione in attesa.')}</p>}
            {recap.daIntegrare.map((l) => (
              <div key={l.chiave} className={s.riga}>
                <span className={s.pallino} data-colore={l.colore} />
                <span className={s.segno} aria-hidden><Icona nome="lezioni" dimensione={14} /></span>
                <button className={s.nome} onClick={() => onApri(l.documentoId)}>{l.pagina}</button>
                <span className={s.nota}>
                  {l.materia} · <Tr frase="{n} minuto di lezione | {n} minuti di lezione" valori={{ n: l.minuti }} n={l.minuti} />
                </span>
              </div>
            ))}
          </section>
        )}

        {/* ── il consuntivo ────────────────────────────────────── */}
        {recap && !!quaderni.length && (
        <section className={s.sezione}>
          <h2 className={s.etichetta}>{tr('Fatto oggi')}</h2>
          {recap && (
            <>
              <p className={s.conto}>{consuntivo(recap.fatto)}</p>

              {recap.fatto.quiz.map((q) => (
                <div key={q.chiave} className={s.riga}>
                  <span className={s.segno} aria-hidden><Icona nome="ripasso" dimensione={14} /></span>
                  <span className={s.nome}>{tr('Quiz')}</span>
                  <span className={s.nota}>{tr('{g} su {t}', { g: q.giuste, t: q.totale })}</span>
                  <span className={`${s.quando} ${q.giuste / q.totale >= 0.7 ? s.bene : s.vicino}`}>
                    {Math.round((q.giuste / q.totale) * 100)}%
                  </span>
                </div>
              ))}

              {recap.fatto.pagine.map((p) => (
                <div key={p.id} className={s.riga}>
                  <span className={s.pallino} data-colore={p.colore} />
                  <button className={s.nome} onClick={() => onApri(p.id)}>{p.titolo}</button>
                  <span className={s.nota}>{p.materia}</span>
                </div>
              ))}
            </>
          )}
        </section>
        )}
      </div>
    </div>
  )
}
