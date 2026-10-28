/*  Il codice che arriva per posta, una cifra per casella.
 *
 *  Era un campo solo con «000000» scritto dentro. Il momento però è
 *  questo: hai il telefono in mano, stai copiando sei cifre, e con un
 *  campo solo non vedi a che punto sei né se ne hai saltata una.
 *
 *  Sei caselle, ma SOTTO c'è ancora un campo solo — trasparente, steso
 *  sopra tutte e sei — e le caselle sono soltanto il vestito. Sembra un
 *  dettaglio e invece è tutto il progetto: sei <input> veri, uno per
 *  cifra, sono una buca dietro l'altra. Il maxLength di uno blocca la
 *  cifra successiva prima che il fuoco sia passato alla casella
 *  accanto, e scrivendo di fretta — ed è un codice, si scrive sempre di
 *  fretta — le cifre si perdono per strada. Il riempimento automatico
 *  del Mac non sa in quale dei sei scrivere. Chi usa VoiceOver sente
 *  sei campi invece di uno.
 *
 *  Con un campo solo non c'è niente da sincronizzare: scrivere,
 *  cancellare, incollare e farsi riempire il codice dal sistema
 *  funzionano perché sono quelli del browser, e non li abbiamo
 *  riscritti noi. Le caselle leggono il valore e si disegnano.
 *
 *  All'ultima cifra si entra da soli, senza premere Entra. */

import { useEffect, useRef } from 'react'
import { tr } from '../lingua/lingua'

export function CampoCodice({ valore, onCambia, onCompleto, cifre = 6, classe, classeCampo, classeCasella }: {
  valore: string
  onCambia: (v: string) => void
  onCompleto?: (v: string) => void
  cifre?: number
  classe?: string
  classeCampo?: string
  classeCasella?: string
}) {
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => { campo.current?.focus() }, [])

  return (
    <div
      className={classe}
      // ovunque si clichi, si scrive: le caselle non sono bersagli separati
      onMouseDown={(e) => { e.preventDefault(); campo.current?.focus() }}
    >
      <input
        ref={campo}
        className={classeCampo}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        /*  Niente maxLength: conterebbe i caratteri grezzi, separatori
         *  compresi, e un codice incollato come «98-76 54» perderebbe
         *  le ultime due cifre prima ancora di arrivare qui. Il limite
         *  si mette dopo, sulle sole cifre. */
        value={valore}
        aria-label={tr('Codice di accesso')}
        onChange={(e) => {
          const pulito = e.target.value.replace(/\D/g, '').slice(0, cifre)
          onCambia(pulito)
          if (pulito.length === cifre) {
            campo.current?.blur()
            onCompleto?.(pulito)
          }
        }}
      />
      {Array.from({ length: cifre }, (_, i) => (
        <span
          key={i}
          className={classeCasella}
          data-attesa={i === valore.length || undefined}
          aria-hidden="true"
        >
          {valore[i] ?? ''}
        </span>
      ))}
    </div>
  )
}
