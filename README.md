# PUNTO
Una sandbox 2D di pixel bianchi su fondo nero. I punti vagano in direzioni casuali; collegandone due si crea una linea che segue entrambi. Ogni legame ha un tipo: **amore** (rosa), **amicizia** (azzurro), **sangue/famiglia** (rosso). È una base per esperimenti con punti, linee e forme in movimento.

## Avvio
Node 22.12+ o 24.

```sh
npm ci
npm run dev
```

`npm test` verifica simulazione e grafo. `npm run build` verifica TypeScript e genera `dist`; `npm run preview` serve la build. Vercel: preset Vite, build `npm run build`, output `dist`. Nessun backend, credenziale, WebGL o asset esterno.

## Esperimenti disponibili
- **Tipo di legame:** scegli Amore, Amicizia o Sangue/famiglia sopra la barra degli strumenti. La scelta colora l’anteprima e i nuovi legami; quelli esistenti mantengono il loro tipo. La stessa coppia di punti conserva un solo legame.
- **Collega (1):** clicca/tocca due punti, oppure trascina da un punto a un altro. Il primo punto resta fermo mentre scegli il secondo; poi entrambi riprendono a muoversi. Puoi creare triangoli, catene e reti; i legami non sono molle e non modificano il moto. Una coppia può avere un solo legame.
- **Sposta (2):** trascina un punto. Tutte le linee collegate lo seguono; rilasciandolo riprende il moto.
- **Aggiungi (3):** clicca/tocca una zona vuota per creare un altro punto, fino a 500.
- **Scollega (4):** clicca/tocca una linea per cancellarla.
- **Spazio:** pausa/ripresa. Anche in pausa puoi costruire e spostare le forme.
- **Esc:** annulla la selezione corrente.

Il pannello in alto a destra modifica quantità e velocità dei punti, rimuove i collegamenti e rigenera la scena. Ridurre il numero di punti elimina anche i relativi legami. Su telefono il pannello è inizialmente chiuso e le aree di selezione sono più grandi. Con la preferenza di sistema per movimento ridotto la sandbox parte in pausa. Lo stato vive solo nella sessione e si azzera al reload.

## Architettura
- `src/simulation/particles.ts`: punti con ID stabili, moto casuale a velocità limitata, bordi riflettenti, grafo di collegamenti, selezione e hit testing. Indipendente dal DOM.
- `src/simulation/relationships.ts`: tipi, etichette e colori condivisi dei legami.
- `src/simulation/math.ts`: generatore casuale con seed e funzioni matematiche.
- `src/engine/loop.ts`: passo fisso 1/60 s e interpolazione; nessun recupero del tempo trascorso nelle schede nascoste.
- `src/input.ts`: strumenti, clic, trascinamento e touch tramite Pointer Events. Aggiungere nuovi esperimenti qui senza cambiare il rendering di base.
- `src/renderer.ts`: Canvas 2D, pixel netti, linee, anteprima del collegamento e indicatori di selezione.
- `src/main.ts`: composizione, controlli, scorciatoie, ridimensionamento e accessibilità dello stato.

Le coordinate si ridimensionano insieme alla finestra; gli ID e i collegamenti rimangono stabili. Il conteggio dei punti è limitato a 500 e i collegamenti a 5000 per evitare crescita incontrollata. Il caso iniziale usa un seed riproducibile; “Ricomincia da zero” genera una nuova disposizione.
