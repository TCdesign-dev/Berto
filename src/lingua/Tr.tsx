import { Fragment, createElement, type ElementType, type ReactNode } from 'react'
import { Tasto } from '../tastiera/Tasto'
import { voce } from './lingua'

/*  Certe frasi hanno dentro una parola in grassetto, un tasto, un
 *  pezzo di codice. Spezzarle in tre `tr()` le renderebbe intraducibili:
 *  in un'altra lingua le parole vanno in un altro ordine. Restano
 *  quindi una frase sola, con la marcatura dentro, e chi traduce la
 *  sposta dove serve:
 *
 *    <Tr frase="Si prende su <code>openrouter.ai/keys</code>." />
 *
 *  Valgono <b>, <i>, <code>, <kbd> e <br>, senza annidarli; se in
 *  quel punto ci va una classe, la si passa a parte, perché chi
 *  traduce non deve avere a che fare con i nomi dei fogli di stile:
 *
 *    <Tr frase="Rifiuta <kbd>X</kbd>" classi={{ kbd: s.tasto }} />
 *
 *  Il <kbd> passa dal <Tasto>, che dei segni dei modificatori fa icone:
 *  chi scrive la frase mette ⌘ e ⇧ come li scriverebbe a mano.
 *
 *  Per infilare qualcosa che non è testo — un'icona, un pulsante — si
 *  lascia un buco e lo si riempie:
 *
 *    <Tr frase="Premi {tasto} per tornare." valori={{ tasto: <kbd>esc</kbd> }} /> */

const PEZZI = /<(b|i|code|kbd)>([\s\S]*?)<\/\1>|<br\s*\/?>|\{(\w+)\}/g

type Marca = 'b' | 'i' | 'code' | 'kbd'

/*  Il tasto ha un componente suo; gli altri tre restano il tag nudo. */
const COME: Partial<Record<Marca, ElementType>> = { kbd: Tasto }

export function Tr({ frase, valori, classi, n }: {
  frase: string
  valori?: Record<string, ReactNode>
  /** la classe da dare a <b>, <i>, <code> o <kbd> dentro la frase */
  classi?: Partial<Record<Marca, string>>
  /** il numero che decide singolare o plurale, se la frase ne ha due */
  n?: number
}) {
  const testo = voce(frase, n ?? (typeof valori?.n === 'number' ? valori.n : undefined))
  const fuori: ReactNode[] = []
  let ultimo = 0
  for (let p; (p = PEZZI.exec(testo)) !== null; ) {
    if (p.index > ultimo) fuori.push(testo.slice(ultimo, p.index))
    if (p[1]) fuori.push(createElement(COME[p[1] as Marca] ?? p[1], { key: fuori.length, className: classi?.[p[1] as Marca] }, p[2]))
    else if (p[3]) fuori.push(<Fragment key={fuori.length}>{valori?.[p[3]] ?? p[0]}</Fragment>)
    else fuori.push(<br key={fuori.length} />)
    ultimo = p.index + p[0].length
  }
  if (ultimo < testo.length) fuori.push(testo.slice(ultimo))
  return <>{fuori}</>
}
