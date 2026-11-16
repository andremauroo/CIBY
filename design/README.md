# CIBY — Identità visiva e interfaccia

[Kit dell’identità in Figma](https://www.figma.com/design/uoudiPCsc9d5dsuUuzOxTJ?node-id=2-29) · [Guida all’identità visiva](identita-visiva.md)

Per il compito C3 sono disponibili [due prototipi low-fidelity touch e voce su smartphone](../consegne/C3/prototipi/README.md), in bianco e nero, in un [file Figma dedicato](https://www.figma.com/design/YyTBZZlfN2fy9cTKnqm4ud). La proposta grafica descritta sotto conserva il proprio ruolo di riferimento distinto.

## Proposta grafica

Interfaccia mobile basata sulla soluzione concettuale C2: partire dagli alimenti disponibili, assegnarli a un prossimo pasto praticabile e rivedere la scelta quando cambiano i programmi.

Dal 16 novembre 2026 l’identità condivisa usa verde CIBY, bianco e un accento tuorlo. Bricolage Grotesque identifica marchio e titoli; Source Sans 3 accompagna testi e quantità. Sito, frontend e presentazioni C1–C3 adottano questa base, con impaginazioni adatte ai rispettivi formati. Le illustrazioni degli alimenti conservano il proprio ruolo nell’interfaccia.

Il kit Figma dell’identità, creato nel piano MAGGICAL, contiene palette, famiglie tipografiche, stili di testo e variabili collegate ai nomi usati nel CSS. È il riferimento per i nuovi elaborati a colori.

Il [concept Figma precedente](https://www.figma.com/design/EuBvAH0SMAk3UEjVfBMxMv) documenta la prima esplorazione e conserva la palette storica. Il file risulta in sola lettura per la connessione attuale: l’aggiornamento dell’identità non è stato applicato a quel file. Il frontend, il kit e la guida qui collegati sono i riferimenti correnti per colori e caratteri. I due prototipi C3 restano in bianco e nero.

Le quattro schermate sono Oggi, Dispensa, Fridgy e Cambio di programma. La Dispensa distingue le priorità dichiarate dall’utente dalle date di scadenza. Il cambio di programma mostra ciò che resta da assegnare prima della conferma.

La pagina “CIBY · App mobile” contiene la presentazione e i componenti. La pagina “Prototipo navigabile” contiene le schermate collegate. Dal pulsante Play si può partire dal flusso “CIBY · Dal frigo al prossimo pasto”.

La navigazione delle aree, “Trova un’idea”, “Cambia programma”, “Scelgo la frittata” e la conferma dello spostamento sono collegate. Ricerca, filtri, inserimento scorte e chat libera sono rappresentazioni grafiche. La [prima implementazione frontend](../app/README.md) rende ora funzionanti scorte locali e flussi di scelta/rinvio; Fridgy resta una demo conversazionale senza modello AI o database remoto. Tutti gli alimenti e le quantità sono dati dimostrativi.

I valori correnti sono disponibili in [design-tokens.json](design-tokens.json). [identity.css](identity.css) raccoglie i colori e i font effettivamente condivisi fra sito e app. Il concept Figma storico contiene le proprie variabili e i componenti di pulsanti e navigazione.

## Collegamenti al progetto

- [Idee da valutare](idee-da-valutare.md): possibili estensioni e loro ruolo rispetto ai task C3.
- [Applicazione](../app/README.md)
- [Consegne e ricerca](../consegne/README.md)
- [Indice del progetto](../README.md)

## Esportazione per il frontend

Le illustrazioni e le icone sono salvate in `app/public/assets`. La mappatura originale tra nodi Figma e SVG è documentata in [figma-export.json](figma-export.json); contorni e icone seguono ora il verde CIBY. I due font sono ospitati localmente, con le rispettive licenze in `app/public/fonts`, e inclusi nella versione offline dell’app.
