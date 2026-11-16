# CIBY — Idee da valutare

Idee indicate dall'utente il 14 novembre 2026, con aggiornamenti del 16 novembre su voce, smartwatch, acquisti esterni e health tracking. Questo documento conserva le possibilità di evoluzione e distingue le direzioni selezionate dai benefici ancora da verificare e dalle funzioni implementate.

## Criterio per la C3

Inserire nei prototipi ciò che serve a completare o comprendere i tre task: riconoscere le priorità, scegliere una preparazione praticabile e riorganizzare dopo un cambiamento. Un elemento di supporto può comparire se cambia una decisione pertinente al task. Gli altri spunti restano qui per una successiva valutazione.

Il testo ufficiale C3 richiede i cammini significativi dei tre task e invita a concentrarsi su concetti, architettura e funzionalità principali. Non richiede di rappresentare ogni possibile funzione del prodotto.

## Idee e collocazione proposta

| Idea indicata | Possibile obiettivo della persona, da verificare | Collocazione proposta in C3 | Prima verifica utile |
|---|---|---|---|
| Dispensa tramite assistente vocale AI | Comunicare gli alimenti comprati con quantità e scadenze riportate | Direzione secondaria confermata il 16 novembre; modifiche previste nel confronto C3, senza riconoscimento vocale reale nei wireframe | Verificare dettatura di più alimenti, comprensione dei dati mancanti, correzione e conferma dell'aggiornamento |
| Supporto vocale alla preparazione in casa | Consultare ingredienti e passaggi con le mani impegnate | Direzione secondaria confermata; Alexa e Apple HomePod sono esempi di integrazione da valutare | Verificare continuità con l'app touch, comprensione dei passaggi e fattibilità dell'integrazione sui dispositivi |
| App vocale per smartwatch | Comunicare acquisti o decisioni sui pasti con richieste brevi dal polso | Possibilità conservata nella traccia vocale secondaria; non richiede un terzo prototipo C3 | Verificare comprensione del riepilogo sul piccolo schermo, correzione e conferma e passaggio allo smartphone per i dettagli |
| Collegamenti per acquistare ingredienti mancanti | Procurarsi ciò che manca per la ricetta scelta, per esempio le uova per una frittata | Possibilità futura collegata a B02 e B04; breve richiamo nelle slide, senza aggiungere un flusso di acquisto ai wireframe C3 | Verificare piattaforme e prodotti disponibili, quantità, tempi di consegna compatibili con il pasto e passaggio dal collegamento all'acquisto |
| Collegamento con app di health tracking | Registrare calorie, nutrienti e altre statistiche dei pasti nelle app scelte dalla persona | Estensione futura da esplorare; la C3 mantiene il focus sulla gestione flessibile dei pasti | Definire fonte dei valori nutrizionali, porzioni, app destinataria e momento di registrazione del pasto effettivamente consumato |
| Mascotte personalizzabile | Sentire il supporto più personale o riconoscibile | Sviluppo futuro; l'eventuale figura dell'assistente può comparire senza un percorso di personalizzazione | Capire se aiuta comprensione e coinvolgimento o distrae dal pasto; evitare di presumere un beneficio |
| Preferenze alimentari, per esempio vegetariane | Trovare una preparazione compatibile con ciò che si vuole mangiare | Possibile vincolo essenziale di T2, dichiarato o corretto nel flusso; non occorre costruire un intero profilo o onboarding | Identificare quali preferenze sono pertinenti agli utenti e verificare comprensione ed effetto sulla proposta |
| Informazioni sugli allergeni | Comprendere le informazioni rilevanti per valutare un alimento o una preparazione | Ipotesi da approfondire separatamente; nei prototipi attuali non è prevista una valutazione di idoneità per persone allergiche | Definire fonti, completezza, aggiornamento e gestione dell'incertezza insieme a persone competenti e utenti interessati |
| Supporto per persone con diabete | Coordinare i pasti con esigenze individuali di salute | Possibile estensione del perimetro, da approfondire; non un semplice valore nello stesso filtro delle preferenze | Ricerca dedicata con utenti e professionisti, prima di formulare capacità e criteri di riuscita |
| Altre idee del gruppo | Da esplicitare prima di scegliere una soluzione | Da aggiungere quando descritte, indicando il collegamento con i bisogni o la necessità di nuova ricerca | Capire per chi e in quale situazione risolverebbero un problema |

Le preferenze alimentari rientrano già, in termini generali, nella fattibilità di B02. Il caso specifico vegetariano resta un esempio progettuale da verificare; non viene presentato come nuovo risultato delle interviste.

## Acquisti esterni e health tracking

Per C3 è sufficiente conservarli nel registro e richiamarli brevemente fra gli sviluppi futuri. Il richiamo è una scelta editoriale: queste idee non aggiungono task o flussi obbligatori ai due prototipi.

**Ingredienti mancanti.** Esempio del gruppo: dopo il lavoro la persona sceglie una frittata, CIBY evidenzia che mancano le uova e offre un collegamento per cercarle su una piattaforma esterna. Amazon Fresh e Deliveroo sono esempi da valutare, non servizi di cui è già verificata disponibilità, compatibilità o integrazione. L'ordine degli ingredienti resta una possibilità, da confrontare anche con una preparazione alternativa già fattibile con le disponibilità. Tempi e quantità dell'acquisto devono rimanere coerenti con l'occasione di consumo.

**Health tracking.** L'idea riguarda il salvataggio di calorie, nutrienti e statistiche presso un'app scelta dalla persona. Prima di progettare lo scambio vanno definiti i dati, la loro fonte, le porzioni e l'azione che registra il consumo. Confermare un pasto programmato in T2 o T3 non significa averlo mangiato: un eventuale invio dei dati deve riferirsi al consumo effettivamente confermato, consentendo correzioni. Questo approfondimento non modifica il focus attuale verso un percorso di dieta o controllo nutrizionale.

## Distinguere preferenze e supporto relativo alla salute

Per le allergie, le informazioni sugli ingredienti e quelle sulla possibile contaminazione sono aspetti distinti: una semplice esclusione per nome non dimostra l'idoneità della preparazione. Il riferimento istituzionale consultato illustra questa distinzione nelle informazioni di etichetta. [GOV.UK, Allergen labelling](https://www.gov.uk/understanding-food-labelling/allergen-labelling).

Per il diabete, il CDC descrive una pianificazione legata alle condizioni individuali e al confronto con professionisti. Da questo ricaviamo una scelta di perimetro: prima di proporre un supporto dedicato, occorre definire un bisogno e un percorso di valutazione specifici. [CDC, Diabetes Meal Planning](https://www.cdc.gov/diabetes/healthy-eating/diabetes-meal-planning.html).

Queste fonti orientano la distinzione fra le idee; non certificano CIBY o le sue proposte. Il documento non definisce raccomandazioni alimentari individuali.

Se in futuro il gruppo sceglierà esplicitamente persone con allergie o diabete come destinatari centrali, il supporto pertinente dovrà diventare parte dei requisiti e della ricerca. In quel caso andranno riesaminati personas, scenari, task e criteri di riuscita; non basterà aggiungere una preferenza al profilo.

## Come raccontare le idee ai docenti

- Nel corpo della C3, mostrare gli elementi che sostengono i task e motivarne il ruolo.
- Se aiuta a chiarire il perimetro, dedicare un breve richiamo o un'appendice alle estensioni da esplorare. L'appendice è una scelta editoriale, non un requisito del compito.
- Presentare le estensioni come ipotesi, indicando che cosa manca per valutarle. Non descriverle come funzionalità già validate o automaticamente adatte a specifiche condizioni di salute.
- Riprendere le altre idee nelle fasi successive quando saranno noti i relativi requisiti, senza attribuire in anticipo un contenuto ai prossimi compiti.

## Come aggiungere una nuova idea

Annotare: situazione e persona interessata; obiettivo; collegamento con un bisogno esistente o necessità di nuova ricerca; ipotesi di soluzione; prima verifica utile. Una proposta non entra automaticamente nel prototipo perché è stata annotata.

[Torna al design](README.md) · [C3](../consegne/C3/README.md)
