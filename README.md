# L’osservatore di vite

Un universo nero di anime autonome, rappresentate da piccoli pixel bianchi. Si incontrano, formano legami, hanno figli, invecchiano e scompaiono. La selezione rivela una costellazione personale e i ricordi delle assenze. Non ci sono obiettivi o punteggi.

## Sviluppo e deploy

Node.js 22.12+ o 24; TypeScript, Vite e Canvas 2D, senza dipendenze di runtime o servizi esterni.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

Vercel: importare `der1988/liminal`, branch `main`, preset **Vite**, build `npm run build`, output **dist**. Nessuna variabile d’ambiente. I salvataggi appartengono al browser e all’origine del sito; un dominio Vercel diverso usa un archivio distinto.

## Osservare

- Tocca un’anima per aprire nome, età, radar e legami. Chiudi con × o Esc.
- Trascina lo spazio per spostare la camera; rotella o pinch per lo zoom.
- **Segui** accompagna l’anima senza influenzarne il movimento. Trascinare la camera interrompe l’inseguimento.
- I nomi nei legami e nella storia permettono di passare a un’altra persona, anche scomparsa.
- **+** chiede soltanto un nome. La nascita attende una coppia adulta idonea; la richiesta è visibile e annullabile. In pausa rimane in attesa.
- La lente cerca i nomi affidati dall’utente, compresi quelli delle persone scomparse.
- Pausa, **1×**, **3×**, **8×** controllano il tempo. Spazio alterna pausa e 1×.

Non si possono spostare anime, imporre rapporti, scegliere i genitori, cambiare caratteristiche o impedire una morte. Le vecchie funzioni manuali del prototipo sono state rimosse perché incompatibili con questo principio.

## Tempo e modello simbolico

Un anno equivale a **22,5 secondi reali a 1×**. La simulazione avanza a passi logici di 1/30 s; le velocità superiori eseguono più passi identici. Il tempo nelle schede nascoste o durante la chiusura non viene recuperato. Una vita di 80 anni dura quindi 30 minuti a 1×.

Il mondo misura 1600×1000 unità, indipendentemente da camera e viewport. Inizia con 80 anime di età diverse, coppie, amicizie e nuclei familiari coerenti. Il target demografico è 80–100, il limite operativo è 120. Le nascite spontanee e nominate usano le stesse regole: genitori vivi di 20–64 anni, amore attivo, nessuna parentela ravvicinata, almeno quattro anni fra nascite e al massimo cinque figli per genitore. Le richieste nominate hanno priorità. Non esiste una garanzia di relazioni per tutti o una regola che crei persone senza genitori per correggere la popolazione.

L’ereditarietà e la personalità sono modelli artistici, non simulazioni scientifiche della genetica umana. Ogni tratto ereditato usa una media parentale con peso casuale 0,35–0,65 e variazione normale di deviazione 6, limitata a 0–100. Le preferenze mescolano componente parentale e indipendente.

## Formule sociali

Le sei dimensioni sono intelligenza, fascino, sensibilità, apertura, stabilità e autonomia. Non vengono sommate in un punteggio della persona.

L’attrazione direzionale combina 62% corrispondenza agli ideali soggettivi, 18% affinità mentale, 10% complementarità emotiva e 10% familiarità. I pesi delle preferenze sono individuali e normalizzati. L’intelligenza modifica la selettività mentale; il fascino influenza soltanto l’attenzione iniziale; l’apertura la propensione a incontrare; la stabilità la continuità; la sensibilità la profondità e persistenza dei ricordi; l’autonomia l’esplorazione. Le formule sono in `parameters.ts`, `affinity.ts`, `movement.ts`, `social.ts` e `memory.ts`.

La distanza rende possibile un incontro, ma non crea da sola un legame. Un fattore limitato a 1–2 compensa la rarefazione della popolazione ampliando le opportunità di incontro: non modifica l’affinità, non impone coppie e non crea nascite senza genitori. La familiarità richiede tempo condiviso e incontri ripetuti. L’amore richiede attrazione reciproca sopra 0,53, rapporto consolidato, persone adulte e assenza di un altro amore attivo. Ogni rapporto conserva inizio, eventuale fine, intensità e storia degli incontri. La famiglia genealogica non viene cancellata.

## Storia e salvataggi

La storia oggettiva registra eventi con identificativi, non racconti inventati. Le memorie individuali possono essere asimmetriche e svanire; non cancellano gli eventi. Gli echi degli scomparsi sono immobili e visibili soltanto nel contesto di una persona che li ricorda. I sedimenti spaziali hanno un limite di 192 celle e un’opacità estremamente bassa.

Salvataggio automatico versionato in IndexedDB ogni 12 secondi e dopo azioni significative, con copia precedente nella stessa transazione. Alla sospensione/chiusura viene scritto anche un diario sincrono locale. Il ripristino controlla checksum, schema, riferimenti, genealogia e contatori e sceglie la copia valida più recente; copie incompatibili vengono conservate separatamente. L’assenza di spazio o l’accesso allo storage negato produce un avviso: non viene dichiarato un salvataggio riuscito. Il ripristino conserva generatore casuale, tick, richieste, eventi e camera e non simula il tempo trascorso a pagina chiusa.

## Moduli

- `engine/loop.ts`: loop conservato dal prototipo.
- `model/types.ts`, `identity.ts`, `random.ts`: anime, parametri e casualità salvabile.
- `model/world.ts`, `clock.ts`, `spatial.ts`, `movement.ts`: mondo, tempo e steering.
- `model/affinity.ts`, `social.ts`: incontri e relazioni.
- `model/genealogy.ts`, `births.ts`: parentela, idoneità, ereditarietà e coda delle nascite.
- `model/lifecycle.ts`, `memory.ts`: morte, memoria e sedimentazione.
- `model/snapshot.ts`, `persistence.ts`: stato serializzabile, controlli e ripristino.
- `renderer.ts`, `view/camera.ts`, `view/input.ts`: rappresentazione e osservazione, senza regole sociali.
- `ui/radar.ts`, `person.ts`, `hud.ts`: radar, biografie, archivio e interfaccia contestuale.

`tests/generations.test.ts` è un avanzamento offline per più generazioni, non una modalità nascosta dell’interfaccia. Il test completo richiede più tempo dei test unitari perché esegue tutti i passi logici, senza saltare nascite, incontri o morti.
