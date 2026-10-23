# L’osservatore di vite — evoluzione del prototipo

Stack conservato: TypeScript, Vite, Canvas 2D, loop a passo fisso. Il vecchio modello di punti rimane temporaneamente come riferimento verificato, ma l’applicazione ora osserva anime autonome: non permette di trascinarle o imporre legami.

La simulazione usa un mondo fisso (1600×1000): resize, camera e selezione non modificano coordinate o regole sociali. Un anno dura 675 tick logici da 1/30 s, cioè 22,5 secondi naturali. L’accelerazione esegue più tick, non salta eventi. Il generatore casuale espone uno stato serializzabile.

Roadmap verificabile:
1. Identità, tempo, movimento organico e osservazione.
2. Compatibilità soggettiva, incontri e legami.
3. Genealogia, ereditarietà e nascite nominate/spontanee.
4. Ciclo vitale, storia oggettiva, memorie ed echi.
5. Radar, ricerca, biografie e persistenza versionata.
6. Test multigenerazionali e bilanciamento.

Regole e formule vivono in `src/model`, rendering e camera in `src/view` e `src/renderer.ts`, controlli contestuali in `src/ui`. Nessuna dipendenza aggiuntiva.
