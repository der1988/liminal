# Una forma di attesa
Un piccolo ecosistema contemplativo in TypeScript, Vite e Canvas 2D. Nessun obiettivo: un abitante autonomo attraversa una stanza; un organismo si ramifica e conserva le tracce della presenza.

## Avvio
Node 22.12+ o 24. `npm ci`, poi `npm run dev`. `npm test` verifica la simulazione; `npm run build` controlla i tipi e crea `dist`. `npm run preview` serve la build.

Il cursore deposita un campo attrattivo locale; tenendo premuto diventa repulsivo. Anche il touch funziona: trascinare per influenzare, sollevare per lasciare dissolvere il campo. Pausa sospende il tempo. Nessun audio o servizio esterno.

## Architettura e file
- `src/engine/loop.ts`: passo fisso di 1/60 s, interpolazione e recupero limitato dopo stalli. Le schede nascoste non accelerano la simulazione.
- `src/simulation/agent.ts`: macchina a stati (wander, rest, observe, approach, retreat, return); velocità lenta, casa familiare, osservazione dei filamenti.
- `src/simulation/growth.ts`: apici direzionali, segmenti e biforcazioni con limiti di memoria. La presenza rallenta e devia la crescita.
- `src/simulation/field.ts`: griglia condivisa bilineare; memoria persistente delle visite e dei filamenti, influenza temporanea firmata, gradienti per la navigazione.
- `src/simulation/math.ts`: vettori e generatore pseudocasuale riproducibile.
- `src/input/pointer.ts`: eventi mouse/touch separati dalla simulazione.
- `src/scene.ts`: composizione e ordine degli aggiornamenti.
- `src/renderer.ts`: solo Canvas 2D; stanza, organismo, abitante e tracce. Coordinate logiche 1000×700 indipendenti dallo schermo.
- `src/main.ts`, `src/style.css`, `index.html`: avvio e interfaccia minima.
- `tests/simulation.test.ts`: campo, autonomia, branching, limiti, influenza e riproducibilità.

## Step reversibili del prototipo
1. Scena statica e loop a passo fisso.
2. Griglia di memoria e input locale con decadimento.
3. Abitante autonomo e ritorno alla zona familiare.
4. Crescita a rami e interazioni attraverso campo e prossimità.
5. Rendering, pausa, touch e verifiche di lunga durata.

Le classi di simulazione non dipendono da DOM o Canvas. Si possono estendere stati, canali della memoria e regole di crescita indipendentemente dal renderer. Il seed iniziale è stabile. La crescita è deliberatamente finita (2200 segmenti, 22 apici): a maturità la scena continua a vivere attraverso l'abitante e la memoria; non salva lo stato al reload.

## Vercel
Importare `der1988/liminal`, branch `main`, preset Vite, build `npm run build`, output `dist`. Nessuna variabile d'ambiente o backend.
