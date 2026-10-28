/*  Un tasto della tastiera, come si vede scritto in un suggerimento:
 *  ⌘K, ⇧↵, ⌥⌘↓, esc.
 *
 *  È un <kbd> normale — il vestito glielo dà chi lo usa, passando la
 *  sua classe, di solito .tasto. Quello che aggiunge è una cosa sola:
 *  i segni dei modificatori diventano icone invece di caratteri.
 *
 *  Vale la pena. Su una tastiera ⌘ ⌥ ⌃ ⇧ ↵ ⌫ ⇥ sono incisi, non
 *  scritti: finché erano caratteri li disegnava il font di chi guarda,
 *  e in Geist Mono — che è il carattere dei tasti in Berto — qualcuno
 *  non c'è proprio e usciva il rettangolo vuoto. Le lettere e le parole
 *  («esc», «spazio», «R») restano testo, come sulla tastiera vera.
 *
 *  Si usa da sé, <Tasto className={s.tasto}>⌘K</Tasto>, oppure arriva
 *  da solo dentro una frase da tradurre, perché <Tr> rende il <kbd>
 *  così: <Tr frase="Accetta <kbd>↵</kbd>" classi={{ kbd: s.tasto }} />. */

import type { ReactNode } from 'react'
import { Icona, type NomeIcona } from '../lib/Icona'

const GLIFI: Record<string, NomeIcona> = {
  '⌘': 'tasto-comando',
  '⌥': 'tasto-opzione',
  '⌃': 'tasto-controllo',
  '⇧': 'tasto-maiuscole',
  '↵': 'tasto-invio',
  '⌫': 'tasto-cancella',
  '⇥': 'tasto-tab',
  '↑': 'tasto-su',
  '↓': 'tasto-giu',
  '←': 'tasto-sinistra',
  '→': 'tasto-destra',
}

/*  Spezza «⌥⌘↓» in tre icone e «⌘R» in un'icona e una lettera. Il testo
 *  di fila resta un pezzo solo, così «spazio» non diventa sei nodi. */
export function glifi(testo: string): ReactNode[] {
  const fuori: ReactNode[] = []
  let parola = ''
  for (const c of testo) {
    const nome = GLIFI[c]
    if (!nome) { parola += c; continue }
    if (parola) { fuori.push(parola); parola = '' }
    fuori.push(<Icona key={fuori.length} nome={nome} dimensione={12} />)
  }
  if (parola) fuori.push(parola)
  return fuori
}

export function Tasto({ className, children }: { className?: string; children?: ReactNode }) {
  return <kbd className={className}>{typeof children === 'string' ? glifi(children) : children}</kbd>
}
