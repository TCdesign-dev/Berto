/*  Il lettore per riascoltare una lezione.
 *
 *  Prima era <audio controls>, cioè il widget grigio del browser: il
 *  solo pezzo di mobilio di sistema in un pannello fatto tutto a mano,
 *  e per giunta in fondo al contenuto che scorre — se stavi leggendo la
 *  trascrizione più su e cliccavi un minuto, partiva un audio e il
 *  comando per fermarlo era fuori schermo.
 *
 *  Adesso è una barra che compare in basso quando qualcosa suona, e
 *  resta lì: chi parla, dove sei, quanto manca, e un modo per fermare.
 *
 *  La barra di avanzamento è un <input type="range"> vestito, non un
 *  div con dentro il trascinamento scritto a mano: così il trascinamento
 *  è quello del sistema, le frecce della tastiera funzionano, e chi usa
 *  VoiceOver sente «cursore». */

import { useEffect, useState } from 'react'
import { Icona } from '../lib/Icona'
import { tr } from '../lingua/lingua'
import s from './LettoreAudio.module.css'

const tempo = (secondi: number) =>
  Number.isFinite(secondi)
    ? `${Math.floor(secondi / 60)}:${String(Math.floor(secondi % 60)).padStart(2, '0')}`
    : '–:––'

export function LettoreAudio({ riferimento, titolo, onChiudi }: {
  riferimento: React.RefObject<HTMLAudioElement | null>
  titolo: string | null
  onChiudi: () => void
}) {
  const [corrente, setCorrente] = useState(0)
  const [durata, setDurata] = useState(NaN)
  const [suona, setSuona] = useState(false)

  useEffect(() => {
    const a = riferimento.current
    if (!a) return
    const tempoCambia = () => setCorrente(a.currentTime)
    const durataCambia = () => setDurata(a.duration)
    const parte = () => setSuona(true)
    const ferma = () => setSuona(false)
    a.addEventListener('timeupdate', tempoCambia)
    a.addEventListener('durationchange', durataCambia)
    a.addEventListener('loadedmetadata', durataCambia)
    a.addEventListener('play', parte)
    a.addEventListener('pause', ferma)
    a.addEventListener('ended', ferma)
    return () => {
      a.removeEventListener('timeupdate', tempoCambia)
      a.removeEventListener('durationchange', durataCambia)
      a.removeEventListener('loadedmetadata', durataCambia)
      a.removeEventListener('play', parte)
      a.removeEventListener('pause', ferma)
      a.removeEventListener('ended', ferma)
    }
  }, [riferimento])

  const avanzamento = Number.isFinite(durata) && durata > 0 ? (corrente / durata) * 100 : 0

  return (
    <>
      <audio ref={riferimento} preload="none" />
      {titolo && (
        <div className={s.barra}>
          <button
            className={s.comando}
            aria-label={suona ? tr('Metti in pausa') : tr('Riprendi')}
            onClick={() => {
              const a = riferimento.current
              if (!a) return
              if (a.paused) void a.play(); else a.pause()
            }}
          >
            <Icona nome={suona ? 'pausa' : 'registra'} dimensione={14} />
          </button>

          <span className={s.titolo}>{titolo}</span>
          <span className={s.quando} data-cifre>{tempo(corrente)}</span>

          <input
            className={s.corsa}
            type="range"
            min={0}
            max={Number.isFinite(durata) && durata > 0 ? durata : 0}
            step="any"
            value={corrente}
            aria-label={tr('Punto della lezione')}
            style={{ '--avanzamento': `${avanzamento}%` } as React.CSSProperties}
            onChange={(e) => {
              const a = riferimento.current
              if (!a) return
              const v = Number(e.target.value)
              a.currentTime = v
              setCorrente(v)
            }}
          />

          <span className={s.quando} data-cifre>{tempo(durata)}</span>
          <button className={s.comando} aria-label={tr('Chiudi il lettore')} onClick={onChiudi}>
            <Icona nome="chiudi" dimensione={14} />
          </button>
        </div>
      )}
    </>
  )
}
