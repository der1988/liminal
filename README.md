# LIMINAL — Room 008
Esperienza 3D in prima persona, sviluppata con Three.js e Vite. Scena procedurale: stanza di motel, corridoio, collisioni, grana analogica, luci fluorescenti e audio opzionale. Non richiede API, credenziali o backend.

## Sviluppo
Node.js 22.12+ oppure 24.

```sh
npm ci
npm run dev
```

WASD / frecce per muoversi, mouse per guardare, Shift per camminare più velocemente, Esc per pausa. Su dispositivi touch: pad sinistro per muoversi, trascinamento a destra per guardare. Attivare l'audio tramite il pulsante in alto.

## Build e Vercel
```sh
npm run build
npm run preview
```
Importare `der1988/liminal` in Vercel; framework **Vite**, comando build `npm run build`, directory output `dist`, directory root quella del repository. Nessuna variabile d'ambiente. Collegare il branch da distribuire; i push successivi attivano i deploy automatici.

La scena richiede WebGL e va verificata in un browser con accelerazione grafica. L'immagine in `public/motel.png` conserva il riferimento visivo generato; la scena navigabile è geometria 3D, non una fotografia panoramica.
