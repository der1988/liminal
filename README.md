# Oltre le guglie
Una passeggiata notturna in prima persona in una Piazza del Duomo immaginaria, durante una notte di Halloween. Corteo, polizia, nebbia, fumogeni e presenze tentacolari continuano a muoversi indipendentemente dall'osservatore.

Il riferimento alle proteste è narrativo: non sono stati verificati eventi, slogan o schieramenti di un weekend preciso. La piazza e la cattedrale sono ricostruzioni procedurali stilizzate ispirate a Milano, non rilievi architettonici o ricostruzioni documentarie.

## Avvio
Node.js 22.12+ o 24.

```sh
npm ci
npm run dev
```

Aprire la pagina e scegliere **Attraversa la nebbia**. WASD o frecce per camminare, mouse per guardare, Esc o il pulsante pausa per fermarsi. Se il browser nega il blocco del puntatore, trascinare sulla scena con il mouse. Su touch: trascinare nella metà sinistra per camminare, nella metà destra per guardare. Il suono ambientale è facoltativo, generato localmente e attivato dal pulsante in alto.

Nessuna arma per il giocatore, missione, vita, danno o salto. Gli scontri avvengono tra gli abitanti della scena. Si può attraversare la folla; solo i limiti esterni della piazza contengono il movimento. I mostri attaccano la scena con affondi e colpi dei tentacoli; i gruppi vicini si disperdono. Manifestanti e polizia si spingono, avanzano e arretrano durante scontri autonomi. Ci sono manganelli, scudi, lanci di pietre e lacrimogeni, senza ferite grafiche. Nessuno di questi eventi colpisce o sposta il giocatore. Pausa sospende la scena. La scheda in background non recupera il tempo trascorso al ritorno.

## Verifica e deploy
```sh
npm test
npm run build
npm run preview
```

Importare `der1988/liminal` in Vercel, branch `main`, preset **Vite**, build `npm run build`, output `dist`. Nessun backend, chiave o variabile d'ambiente. Il browser richiede WebGL e accelerazione grafica. Modelli e texture sono serviti dallo stesso sito; non ci sono richieste a servizi terzi durante il gioco.

## Struttura
- `src/main.ts`: rendering WebGL, ingresso, pausa, ridimensionamento, gestione perdita del contesto.
- `src/engine/loop.ts`: aggiornamento a passo fisso di 1/60 s e interpolazione della camera.
- `src/player/movement.ts`: movimento puro e limiti della piazza, verificati dai test.
- `src/player/controller.ts`: mouse, pointer lock con fallback, tastiera, touch e pulizia degli input.
- `src/scene.ts`: illuminazione, composizione e aggiornamento del mondo.
- `src/world/cathedral.ts`, `city.ts`, `materials.ts`: architettura, piazza, arredi e texture procedurali.
- `src/world/crowd.ts`: 270 figure animate, 44 poliziotti, cartelli e fumogeni. Corpi articolati disegnati con instancing.
- `src/world/detailed-police.ts`: 28 unità del cordone con modello riggato e animazioni skeletal Idle/Walk/Run; fallback procedurale se l’asset non si carica.
- `src/world/entities.ts`: tre presenze con mandibole, denti, spine, arti portanti e tentacoli; caricamento, affondo e recupero, sempre indipendenti dal giocatore.
- `src/simulation/events.ts`: fasi degli scontri e campi di fuga condivisi tra creature e folla.
- `src/world/merge.ts`: geometria statica raggruppata per materiale per limitare le draw call.
- `src/effects/atmosphere.ts`: banchi di nebbia, aloni, cenere e lampeggianti.
- `src/effects/fog.ts`: integrazione della nebbia lungo il raggio della camera, limitata dalla profondità delle superfici, con densità per altezza e turbolenza.
- `src/effects/post.ts`: depth buffer, bloom, aberrazione cromatica tenue, grana e vignettatura.
- `src/effects/clashes.ts`: pietre, lacrimogeni, scintille e transenna rovesciata.
- `src/effects/environment.ts`: bake delle luci notturne per riflessi PBR su pavimentazione bagnata e pozzanghere.
- `src/world/detail.ts`: rilievi, nicchie, statue e giunti della facciata.
- `src/effects/audio.ts`: vento, ronzio, sirena distante, ruggiti e colpi sintetizzati con Web Audio.

La scena combina architettura procedurale dettagliata, corpi articolati e un modello riggato con texture per il cordone più vicino. Non è una scansione fotogrammetrica della piazza. Materiali a rilievo, marmo, umidità e pozzanghere migliorano la resa; la nebbia ha meno campioni su mobile per contenere il costo GPU. Crediti del modello in `THIRD_PARTY_NOTICES.md`. I moti dei personaggi sono ciclici e autonomi; non simulano una protesta storica. Il pixel ratio è limitato su desktop e mobile. La preferenza di sistema per movimento ridotto disattiva il dondolio della camera e la grana animata; la scena conserva le animazioni ambientali. Nessun salvataggio persistente.
