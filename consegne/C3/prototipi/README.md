# C3 — Prototipi low-fidelity

Prima versione del 14 novembre 2026: due prototipi in bianco e nero, costruiti con livelli modificabili in Figma. La versione touch comprende 16 schermate; quella vocale 19 stati di dialogo. Entrambe coprono i tre task concordati.

## Aprire i prototipi

- [Prototipo 1 — Touch su smartphone](https://www.figma.com/proto/YyTBZZlfN2fy9cTKnqm4ud?page-id=0%3A1&node-id=8-295&starting-point-node-id=8%3A295&scaling=scale-down)
- [Prototipo 2 — Voce su smartphone](https://www.figma.com/proto/YyTBZZlfN2fy9cTKnqm4ud?page-id=5%3A2&node-id=11-315&starting-point-node-id=11%3A315&scaling=scale-down)
- [File Figma modificabile dei prototipi C3](https://www.figma.com/design/YyTBZZlfN2fy9cTKnqm4ud)

I prototipi C3 sono in un file dedicato dello spazio MAGGICAL, distinto dalla precedente proposta mobile a colori.

Dal file Design, scegliere la pagina «C3 · 01 Touch» oppure «C3 · 02 Voce» e usare Play. Ogni pagina contiene tre punti di partenza, uno per task. Le note sotto il telefono descrivono la simulazione e sono separate dall'interfaccia rappresentata.

| Task | Touch: punto di partenza | Voce: punto di partenza |
|---|---|---|
| T1 · Alimenti prioritari | [Apri T1 touch](https://www.figma.com/proto/YyTBZZlfN2fy9cTKnqm4ud?page-id=0%3A1&node-id=8-295&starting-point-node-id=8%3A295&scaling=scale-down) | [Apri T1 voce](https://www.figma.com/proto/YyTBZZlfN2fy9cTKnqm4ud?page-id=5%3A2&node-id=11-315&starting-point-node-id=11%3A315&scaling=scale-down) |
| T2 · Cena praticabile | [Apri T2 touch](https://www.figma.com/proto/YyTBZZlfN2fy9cTKnqm4ud?page-id=0%3A1&node-id=8-615&starting-point-node-id=8%3A615&scaling=scale-down) | [Apri T2 voce](https://www.figma.com/proto/YyTBZZlfN2fy9cTKnqm4ud?page-id=5%3A2&node-id=11-763&starting-point-node-id=11%3A763&scaling=scale-down) |
| T3 · Cambio di programma | [Apri T3 touch](https://www.figma.com/proto/YyTBZZlfN2fy9cTKnqm4ud?page-id=0%3A1&node-id=8-951&starting-point-node-id=8%3A951&scaling=scale-down) | [Apri T3 voce](https://www.figma.com/proto/YyTBZZlfN2fy9cTKnqm4ud?page-id=5%3A2&node-id=11-1249&starting-point-node-id=11%3A1249&scaling=scale-down) |

## Come usare i prototipi

**Touch.** Le scelte e i campi seguono valori prestabiliti: per esempio 400/200 g e 20/10 minuti. I pulsanti consentono di seguire i cammini principali e i casi di recupero. Non è un'app con inserimento libero di qualsiasi dato.

**Voce.** Il pulsante «Parla» avanza lungo il turno dimostrativo principale. Per scegliere una frase diversa, usare i comandi nella zona grigia «Simulazione vocale · Figma», fuori dal telefono. Non viene registrato audio: trascrizione, fraintendimento e risposta sono stati progettati per questa simulazione.

Le risposte restano rileggibili sullo smartphone. Il confronto riguarda la navigazione visuale nel primo prototipo e il dialogo a turni nel secondo, anche quando entrambi condividono un riepilogo visivo.

## Copertura dei task e dei cammini

Gli identificativi corrispondono ai nomi delle schermate visibili nel canvas Figma.

| Percorso | Touch | Voce |
|---|---|---|
| T1 · Priorità | T01 → T02 | V01 → V02 → V03 |
| T2 · Scelta della cena | T05 → T07 → T08 | V06 → V07 → V10 |
| T3 · Rinvio | T09 → T10 → T12 → T15 | V11 → V13 → V15 → V17 |
| T3 · Adattamento | T09 → T10 → T11 → T14 | V11 → V12 → V16 → V18 |
| Quantità o riconoscimento da correggere | T02 → T03 → T04 → T03 → T02 | V03 → V04 → V05 → V03 |
| Occasione futura incerta | T12 → T13 → T12 → T15 | V13 → V14 → V15 → V17 |
| Annullamento della revisione | T15 → T16 → T09 | V17 → V19 → V11 |
| Vincolo da rivedere | T05 → T06 → T05 | V07 → V08 → V06 |

Nel percorso narrativo i task si collegano: le priorità portano alla scelta della cena e la cena prevista può essere riorganizzata. I punti di partenza separati permettono di esaminare ogni task senza ripetere tutto il percorso.

## Dati e collegamento con lo storyboard

L'esempio usa 400 g di zucchine disponibili, 4 uova e 200 g di riso. La frittata per stasera assegna 200 g di zucchine e 2 uova; il riso a pranzo domani altri 200 g di zucchine e 80 g di riso. L'invito a cena porta a confrontare adattamento e rinvio.

Il ramo di rinvio mantiene il riso a pranzo e sposta la frittata alla cena confermata di domani, come previsto nella revisione dello storyboard. Il ramo di adattamento porta la frittata a pranzo e sposta il riso a cena. In entrambi i casi si mostrano 400 g complessivi di zucchine assegnate, senza duplicare la disponibilità.

Alimenti, quantità, tempi e preparazioni sono dimostrativi e non derivano da interviste o diario. La priorità delle zucchine è dichiarata dalla persona; una data mancante resta tale. Confermare il programma non attesta il consumo degli alimenti.

## Verifiche eseguite

- Controllo delle reazioni di navigazione definite in Figma: 51 collegamenti touch e 76 vocali, con destinazioni valide.
- Tutte le 16 schermate touch e i 19 stati vocali risultano raggiungibili dal rispettivo inizio.
- Verificati nella struttura i cammini dei tre task, adattamento, rinvio, incertezza, annullamento e i casi di recupero riportati sopra.
- Esaminate le composizioni renderizzate complete. Le etichette dei pulsanti sono state corrette durante la verifica; il contenuto rappresentato rientra nei telefoni di 390 × 844.
- Testi visibili in Manrope; nessuna schermata dell'interfaccia è un'immagine appiattita.
- Il 16 novembre sono stati seguiti manualmente in Play i tre task in entrambe le modalità e i casi di adattamento, rinvio, occasione incerta, correzione, annullamento e vincolo di tempo incompatibile. La prova ha visitato tutte le 16 schermate touch e i 19 stati vocali. L’annullamento è stato provato dal ramo di adattamento; i 127 collegamenti non sono stati tutti cliccati singolarmente.

Questi controlli verificano la costruzione dei prototipi, non la loro usabilità con persone. Non sono stati eseguiti test con utenti, riconoscimento vocale o generazione AI. La copertura completa dei collegamenti è stata verificata nella struttura Figma; la prova manuale ha seguito i cammini principali e i recuperi descritti, senza verificare singolarmente ogni possibile combinazione di ritorno.

L’apertura in Play ha funzionato nel browser di verifica senza una richiesta di accesso al documento. Non è stato necessario autenticarsi per percorrere i prototipi e non sono stati modificati i permessi di condivisione.

## Confronto

La [presentazione C3](../presentazione/CIBY-C3.pdf), slide 25–27, documenta confronto e scelta motivata. Il touch è la modalità principale. La voce resta una traccia secondaria per dispensa e preparazione, con possibili sviluppi su smartwatch e dispositivi domestici. I prototipi C3 conservano la voce simulata su smartphone.

[Torna alla C3](../README.md)
