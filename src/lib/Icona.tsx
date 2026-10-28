/*  Il set di icone di Berto.
 *
 *  Dal restyling di ottobre 2026: le quarantaquattro icone disegnate
 *  a mano su griglia 20 se ne vanno, e al loro posto c'è Phosphor, peso
 *  «regular» — tratto 1,5 su griglia 256, cioè la stessa consistenza di
 *  prima ma disegnata da chi lo fa di mestiere, e con novemila sorelle
 *  pronte quando servirà un'icona nuova.
 *
 *  Il resto non cambia di una virgola: stesso componente, stessi nomi
 *  italiani, stessa chiamata. <Icona nome="cerca" /> continua a
 *  funzionare in tutti e quarantanove i file che la usano — ed è il
 *  motivo per cui questa tabella esiste invece di importare Phosphor
 *  direttamente dove serve. Il giorno che cambiamo di nuovo set, si
 *  cambia qui e basta.
 *
 *  Le icone prendono il colore dal testo (currentColor): nessun colore
 *  scritto qui. 16 px nell'interfaccia, 14 nei pulsanti con testo.
 *  Un'icona da sola in un pulsante vuole l'aria-label sul pulsante. */

import {
  Archive, ArrowClockwise, ArrowDown, ArrowElbowDownLeft, ArrowFatUp, ArrowLeft,
  ArrowLineRight, ArrowRight, ArrowSquareOut, ArrowUp, Backspace, Book, Browser,
  Calendar, Cards, CaretDown, CaretLeft, CaretRight, ChatCircle, ChatCircleDots,
  Check, CircleNotch, Command, Control, DotsSixVertical, DotsThree, DownloadSimple,
  EyeSlash, FadersHorizontal, House, Image, Key, KeyReturn, Keyboard, LinkBreak,
  ListChecks, MagnifyingGlass, MathOperations, Microphone, MicrophoneSlash, Moon,
  Option, Pause, Plus, Record, Sidebar, Sparkle, Stop, Subtitles, Sun, TextT,
  Trash, Warning, Waveform, X,
  type Icon,
} from '@phosphor-icons/react'

/*  Il nome italiano dice a cosa serve l'icona, non cosa raffigura:
 *  «termina» resta «termina» anche se il disegno è un quadrato. */
const SEGNI = {
  'barra-laterale': Sidebar,
  'cerca': MagnifyingGlass,
  'materie': House,
  'microfono': Microphone,
  'microfono-muto': MicrophoneSlash,
  'pausa': Pause,
  'termina': Stop,
  'registra': Record,
  'lezioni': Waveform,
  'immagini': Image,
  'elimina': Trash,
  'altro': DotsThree,
  'giu': CaretDown,
  'destra': CaretRight,
  'sinistra': CaretLeft,
  'accetta': Check,
  'chiudi': X,
  'impostazioni': FadersHorizontal,
  'chiaro': Sun,
  'scuro': Moon,
  'nuovo': Plus,
  'materia': Book,
  'ripasso': Cards,
  'archivio': Archive,
  'scollegato': LinkBreak,
  'errore': Warning,
  'altra-finestra': Browser,
  'invio': ArrowElbowDownLeft,
  'ai': Sparkle,
  'chiave': Key,
  'domanda': ChatCircleDots,
  'compiti': ListChecks,
  'commento': ChatCircle,
  'esame': Calendar,
  'sposta': DotsSixVertical,
  'riprova': ArrowClockwise,
  'attesa': CircleNotch,
  'testo': TextT,
  'formula': MathOperations,
  'trascrizione': Subtitles,
  'scarica': DownloadSimple,
  'nascondi': EyeSlash,
  'tastiera': Keyboard,
  'apri-fuori': ArrowSquareOut,

  /*  I segni della tastiera. Su una tastiera vera ⌘ ⌥ ⌃ ⇧ sono incisi,
   *  non scritti: come caratteri li disegnava il font di chi guarda, e
   *  in Geist Mono qualcuno manca del tutto. Dentro il <Tasto> ci vanno
   *  queste, che sono icone come le altre. */
  'tasto-comando': Command,
  'tasto-opzione': Option,
  'tasto-controllo': Control,
  'tasto-maiuscole': ArrowFatUp,
  'tasto-invio': KeyReturn,
  'tasto-cancella': Backspace,
  'tasto-tab': ArrowLineRight,
  'tasto-su': ArrowUp,
  'tasto-giu': ArrowDown,
  'tasto-sinistra': ArrowLeft,
  'tasto-destra': ArrowRight,
} satisfies Record<string, Icon>

export type NomeIcona = keyof typeof SEGNI

export function Icona({ nome, dimensione = 16, className }: {
  nome: NomeIcona
  dimensione?: number
  className?: string
}) {
  const Segno = SEGNI[nome]
  return (
    <Segno
      className={className}
      size={dimensione}
      weight="regular"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none', display: 'block' }}
    />
  )
}
