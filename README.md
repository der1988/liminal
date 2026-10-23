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

Nessuna arma, missione, vita, danno, salto o interazione con la folla. Si può attraversare la folla; solo i limiti esterni della piazza contengono il movimento. Mostri, manifestanti e polizia non reagiscono al giocatore. Pausa sospende la scena. La scheda in background non recupera il tempo trascorso al ritorno.

## Verifica e deploy
```sh
npm test
npm run build
npm run preview
```

Importare `der1988/liminal` in Vercel, branch `main`, preset **Vite**, build `npm run build`, output `dist`. Nessun backend, chiave o variabile d'ambiente. Il browser richiede WebGL e accelerazione grafica. Non ci sono richieste a servizi terzi per modelli, texture, font o audio.

## Struttura
- `src/main.ts`: rendering WebGL, ingresso, pausa, ridimensionamento, gestione perdita del contesto.
- `src/engine/loop.ts`: aggiornamento a passo fisso di 1/60 s e interpolazione della camera.
- `src/player/movement.ts`: movimento puro e limiti della piazza, verificati dai test.
- `src/player/controller.ts`: mouse, pointer lock con fallback, tastiera, touch e pulizia degli input.
- `src/scene.ts`: illuminazione, composizione e aggiornamento del mondo.
- `src/world/cathedral.ts`, `city.ts`, `materials.ts`: architettura, piazza, arredi e texture procedurali.
- `src/world/crowd.ts`: 210 figure animate, 36 poliziotti, cartelli e fumogeni. Corpi disegnati con instancing.
- `src/world/entities.ts`: tre presenze con arti articolati, senza logica di combattimento.
- `src/world/merge.ts`: geometria statica raggruppata per materiale per limitare le draw call.
- `src/effects/atmosphere.ts`: banchi di nebbia, aloni, cenere e lampeggianti.
- `src/effects/post.ts`: bloom, aberrazione cromatica tenue, grana e vignettatura.
- `src/effects/audio.ts`: vento, ronzio e sirena distante sintetizzati con Web Audio.

Il prototipo usa geometrie stilizzate, non asset fotorealistici. I moti dei personaggi sono ciclici e autonomi; non simulano una protesta storica. Il pixel ratio è limitato su desktop e mobile. La preferenza di sistema per movimento ridotto disattiva il dondolio della camera e la grana animata; la scena conserva le animazioni ambientali. Nessun salvataggio persistente.
