<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="design/assets/ciby-wordmark-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="design/assets/ciby-wordmark.svg">
    <img src="design/assets/ciby-wordmark.svg" alt="CIBY" width="240">
  </picture>
</h1>

**Con CIBY scegli cosa preparare con quello che hai, anche quando cambiano i programmi.**

CIBY nasce per il corso di Fondamenti di Human-Computer Interaction del Politecnico di Milano. Il nostro obiettivo è aiutare i giovani adulti a gestire la spesa e i pasti, facilitando le scelte quotidiane a partire dagli alimenti disponibili e contribuendo a ridurre lo spreco domestico.

[Sito web e demo interattiva](https://andremauroo.github.io/CIBY/) · [Documentazione dell'app](app/README.md) · [Materiali del progetto](consegne/README.md)

## L'applicazione

Abbiamo sviluppato un prototipo web pensato per smartphone, con quattro funzionalità principali:

- **Dispensa:** gestire gli alimenti, le quantità e le priorità di utilizzo.
- **Ricette e Fridgy:** trovare preparazioni compatibili con gli ingredienti disponibili, il tempo e le preferenze.
- **Pasti:** organizzare il calendario settimanale e adattarlo quando cambiano i programmi.
- **Lista della spesa:** individuare gli ingredienti mancanti e registrare gli acquisti in dispensa.

Il prototipo è sviluppato con React, TypeScript e Vite ed è attualmente avviabile in locale. Dispensa, pasti e lista della spesa sono salvati nel browser; Fridgy è utilizzabile in modalità dimostrativa o con un modello AI configurato dall'utente.

### Avvio in locale

Con Node.js 24 LTS (o 22.12+ della serie 22) e npm, dalla radice del repository:

```sh
cd app
npm ci
npm run dev
```

Aprire l'indirizzo mostrato da Vite nel terminale. Per configurazione, prove su smartphone e test, consultare la [documentazione dell'app](app/README.md).

## Percorso di progettazione

| Fase | Contenuti | Materiali |
| --- | --- | --- |
| [C1 — Individuazione dei bisogni](consegne/C1/README.md) | Interviste, sondaggio e ricerca | [Presentazione PDF](consegne/C1/presentazione/CIBY-C1.pdf) · [Sondaggio](consegne/C1/altro/Sondaggio.pdf) |
| [C2 — Raffinamento e focus](consegne/C2/README.md) | Bisogni, personas, scenari e scelta della soluzione | [Presentazione PDF](consegne/C2/presentazione/CIBY-C2.pdf) · [FigJam](https://www.figma.com/board/Aa9cVd9wI6ifqZyzO30I9m/Compito-2) |
| [C3 — Task, storyboard e primi prototipi](consegne/C3/README.md) | Analisi dei task, flussi e confronto delle modalità di interazione | [Presentazione PDF](consegne/C3/presentazione/CIBY-C3.pdf) · [Storyboard](consegne/C3/storyboard/CIBY-C3-storyboard-A4.pdf) · [Prototipi touch e voce](consegne/C3/prototipi/README.md) |

## Struttura del repository

| Area | Contenuto |
| --- | --- |
| [`app/`](app/) | Codice dell'applicazione, risorse, test e [roadmap](app/roadmap.md) |
| [`consegne/`](consegne/README.md) | Ricerca, presentazioni e prototipi |
| [`design/`](design/README.md) | [Identità visiva](design/identita-visiva.md), [token grafici](design/design-tokens.json) e riferimenti Figma |
| [`site/`](site/) | [CSS](site/site.css), [JavaScript](site/demo.js) e [immagini](site/assets/); la pagina [HTML](index.html) resta nella radice per GitHub Pages |

## Il gruppo

**MAGGICAL** — Andrea Mauro, Marco Macherelli, Gabriele Martignoni, Rime Chamkar, Emanuele Marcantonio ed Edoardo Ughi.
