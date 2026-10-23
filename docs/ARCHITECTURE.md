# Note di implementazione

Il progetto conserva TypeScript, Vite, Canvas 2D, il loop e le funzioni matematiche del prototipo. La logica dei collegamenti manuali è stata sostituita da regole autonome perché l’osservatore non deve imporre il destino delle anime. Nessuna nuova dipendenza.

Le sei fasi sono tracciate da commit separati: fondamenta; identità e relazioni; nascite; ciclo vitale e memoria; interfaccia e persistenza; verifiche e bilanciamento.

Il mondo non conosce selezione, viewport o camera. I dati casuali sono consumati solo dalla simulazione. Clock e RNG sono ripristinabili; gli ID non vengono riutilizzati. Gli archivi storici restano nel mondo, ma non entrano nella griglia spaziale. Gli indici di parentela e relazione vengono ricostruiti al caricamento.

Le regole sociali restano probabilistiche, con parametri documentati nel README. La popolazione iniziale è una condizione iniziale coerente, non una biografia riempita con eventi casuali scollegati. Le biografie successive contengono esclusivamente eventi effettivamente registrati.

Il primo bilanciamento si estingueva perché i nuovi incontri ignoravano la familiarità preesistente e gli accompagnamenti erano troppo brevi. La correzione conserva la storia degli incontri nei rapporti, allunga l’accompagnamento e aumenta le opportunità di incontro, senza creare coppie o nascite obbligatorie. Un ulteriore controllo di rarefazione amplia moderatamente il raggio di incontro quando la popolazione si riduce, evitando che il calo delle opportunità spaziali si autoalimenti. Le verifiche usano tre seed per almeno 300 anni. La scelta degli accompagnamenti distingue la prossimità familiare infantile dall’esplorazione adulta: la parentela resta consultabile e significativa, ma non intrappola gli adulti in gruppi incapaci di incontrare persone non imparentate.

Gli archivi crescono con le vite osservate: la memoria grafica dei sedimenti è limitata, la storia oggettiva no. IndexedDB conserva i dati finché il browser dispone di spazio; lo storage locale non è una sincronizzazione cloud o un backup fra dispositivi.
