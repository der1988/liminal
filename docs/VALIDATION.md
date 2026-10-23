# Verifiche del prototipo

Verificato il 23 ottobre 2026.

## Regole

I test in `tests/world.test.ts`, `births.test.ts`, `memory.test.ts` e `persistence.test.ts` coprono:

- ID stabili, nomi e sei caratteristiche tra 0 e 100.
- Preferenze normalizzate, attrazione asimmetrica, ruolo di fascino, apertura, stabilità, sensibilità e autonomia.
- Amore reciproco fra adulti; esclusione di minori, fratelli, genitori/figli e coppie multiple.
- Esattamente due genitori per ogni nascita, trasmissione dei tratti, limiti demografici e intervalli fra nascite.
- Richieste nominate e annullamento quando non esistono genitori idonei.
- Equivalenza a 1×, 3× e 8×, anche attraverso quindici anni con nascite e morti.
- Movimento contenuto, dispersione spaziale e autonomia adulta dalla prossimità familiare infantile.
- Morte registrata una volta sola e impossibilità di nuovi legami per gli scomparsi.
- Separazione fra eventi oggettivi e memoria individuale, asimmetria e decadimento.
- Famiglia genealogica permanente anche quando cambia l’intensità affettiva.
- Limite di sedimentazione e assenza di fantasmi persistenti fuori dalla selezione.
- Ripristino esatto di genealogia, eventi, tratti, memorie, coda delle nascite, clock e stato casuale; rifiuto di versioni e dati corrotti.

## Più generazioni

`tests/generations.test.ts` esegue tutti i tick per 300 anni su tre seed, senza saltare eventi. La prova finale ha dato:

| Seed | Anime vive al termine | Vite complessive | Intervallo della popolazione |
| --- | ---: | ---: | ---: |
| 91204 | 97 | 426 | 80–100 |
| 42 | 94 | 441 | 80–100 |
| 733 | 100 | 430 | 80–100 |

La prova verifica almeno quattro generazioni, validità della genealogia e dei salvataggi, monogamia attiva, conteggio delle morti, dispersione e sedimenti limitati. Questi risultati descrivono i seed verificati, non una garanzia matematica per ogni universo possibile.

## Browser

Verificato con Chromium su viewport desktop 1360×900 e touch 390×844:

- Apertura direttamente nell’universo, senza titolo o istruzioni centrali.
- Selezione, radar con sei etichette, inseguimento e interruzione tramite pan.
- Inserimento di un nome, attesa in pausa, nascita valida, selezione automatica e legami parentali.
- Reload con tempo, RNG, persone ed eventi identici; nessun recupero del tempo offline.
- Ricerca dei nomi, consultazione della scheda dopo la morte e navigazione tramite un’eco.
- Recupero dalla copia precedente se il salvataggio primario è danneggiato.
- Conservazione separata dei dati incompatibili, avviso e nuovo universo funzionante.
- Scheda mobile inferiore al 53% dell’altezza dello schermo.
- Nessun errore di esecuzione nelle verifiche.

## Comandi

- `npm run test:unit`: regole e persistenza, pochi secondi.
- `npm run test:generations`: tre universi per 300 anni, alcuni minuti.
- `npm test`: entrambe le serie.
- `npm run build`: TypeScript e bundle Vite.

I salvataggi restano locali al browser. La pubblicazione Vercel e la sincronizzazione fra dispositivi non fanno parte di queste verifiche.
