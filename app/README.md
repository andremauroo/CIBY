# CIBY — App, prototipo HCI

Web app mobile React + TypeScript, costruita dalle quattro schermate [Figma CIBY](https://www.figma.com/design/EuBvAH0SMAk3UEjVfBMxMv). L'obiettivo è provare le interazioni, mantenendo aperte le decisioni di prodotto.

## Avvio

Usare Node.js 24 LTS (oppure 22.12+ della serie 22) e npm.

```sh
cd app
npm ci
npm run dev
```

Aprire l'indirizzo Local mostrato da Vite. La porta prevista è 5173. Il server espone anche un indirizzo Network per le prove sulla stessa Wi-Fi.

### Avvio su Windows

Installare Node.js nella versione indicata sopra e Git, quindi aprire PowerShell nella cartella in cui conservare il progetto:

```powershell
git clone https://github.com/andremauroo/CIBY.git
cd CIBY\app
npm.cmd ci
npm.cmd run dev
```

Se la repository è già stata scaricata, aprire direttamente la sua cartella `app` e usare gli ultimi due comandi. `npm.cmd` permette di eseguire npm da PowerShell senza modificare la policy degli script. Lasciare aperto il terminale e aprire l'indirizzo Local indicato da Vite nel browser. Per fermare il server premere Ctrl+C.

Per vedere la build locale:

```powershell
npm.cmd run build
npm.cmd run preview
```

Questi comandi avviano la stessa web app usata su macOS; non richiedono backend, account o Android Studio. Per usare il telefono via Wi-Fi seguire la sezione successiva.

## Cosa si può provare

- **Oggi:** alimento prioritario, idea per il pasto, preparazione e cambio di programma.
- **Dispensa:** ricerca, filtri, inserimento, modifica, rimozione e priorità decisa dalla persona. La vista Spesa raccoglie acquisti manuali o ingredienti scelti dal ricettario.
- **Fridgy:** dialogo a regole dichiarato, risposte rapide, tempo e porzioni, esclusione di ingredienti, richieste fuori ambito. Tre ricette dimostrative; nessun LLM o API esterna. Le correzioni in chat non modificano la dispensa.
- **Pasti:** conseguenze del rinvio, cambio di porzioni, conferma e annullamento dell'ultimo spostamento della sessione.
- **Consumo:** solo “Ho cucinato questo pasto” e la conferma successiva sottraggono gli ingredienti. Il consumo non si ripete due volte.

Alimenti, pasto, ricette preferite e lista della spesa sono salvati in localStorage. Il dialogo e l'annullamento del rinvio restano nella sessione. Nessun account o backend. Browser e dispositivi diversi hanno dati separati; la cancellazione dei dati del sito li rimuove. Il pulsante M apre spiegazioni e ripristino dell'esempio con conferma.

Il ricettario è piccolo: non interpreta qualsiasi richiesta e non verifica sicurezza alimentare, allergeni o diete. I tempi sono stime; per il riso va verificata la confezione. Nomi e unità degli ingredienti devono essere riconoscibili (zucchine, uova, riso in grammi, pomodori). Gli altri alimenti si possono gestire nella dispensa ma non generano nuove ricette.

## Prova su telefono fisico

1. Collegare computer e telefono alla stessa rete Wi-Fi.
2. Avviare `npm run dev` sul computer (su Windows: `npm.cmd run dev`) e lasciare aperto il terminale.
3. Aprire Safari su iPhone o Chrome su Android e inserire l'indirizzo **Network** stampato da Vite, `http://IP_DEL_PC:5173` (sostituire `IP_DEL_PC` con l’indirizzo corrente del computer mostrato da Vite). Non usare localhost sul telefono: indicherebbe il telefono stesso.
4. Se non si apre, consentire a Node le connessioni in ingresso nel firewall del computer e verificare che la rete non isoli i dispositivi. Non serve aprire porte sul router.

Su Windows, usare una rete domestica fidata con profilo **Privato** e consentire Node.js su reti private quando Windows Firewall lo richiede. Se il permesso manca, cercare “Consenti app tramite Windows Firewall” nelle impostazioni e controllare Node.js. Non disabilitare il firewall. Il comando `ipconfig` in PowerShell mostra l'indirizzo IPv4 della scheda Wi-Fi: deve corrispondere all'indirizzo Network scelto da Vite. Con più schede o VPN evitare l'indirizzo di un adattatore virtuale. Computer e telefono devono usare la stessa rete principale, senza isolamento dei dispositivi.

Questa modalità basta per provare touch, scrolling, tastiera virtuale, layout e flussi. Non è stata ancora eseguita una prova su un telefono fisico: i test automatici emulano viewport mobile in Chromium.

Per installazione e offline completi occorre servire la build via **HTTPS**, oppure su localhost per i test dal computer. L'HTTP dell'IP locale non abilita il service worker sul telefono. Pubblicare in futuro solo `app/dist` su un hosting statico HTTPS, poi usare “Aggiungi alla schermata Home” su Safari o “Installa app” su Chrome dove disponibile. L'hosting non è stato configurato o pubblicato. Fonte: [web.dev, strumenti PWA](https://web.dev/learn/pwa/tools-and-debug), [installazione](https://web.dev/learn/pwa/installation).

```sh
npm run build
npm run preview
```

La build contiene manifest, icone e service worker con cache degli asset locali. Dopo una prima visita online completata, la build può funzionare offline. Un aggiornamento del service worker entra in uso dopo la chiusura delle vecchie schede. Non registriamo il service worker durante lo sviluppo.

## Simulatore ed emulazione

- Chrome DevTools → modalità dispositivo: provare 320, 390 e 430 px, tastiera e zoom.
- iOS Simulator → aprire Safari e l'URL locale del Mac; provare anche tastiera, orientamento e dimensioni del testo. Non è necessaria una build nativa.
- Android Emulator → Chrome e `http://10.0.2.2:5173` per il server sul computer host.

## Verifiche

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Test di dominio: compatibilità degli ingredienti, quantità, correzioni, consumo unico e recupero di salvataggi corrotti. Test browser: ricerca/modifica/persistenza, correzione conversazionale, rinvio/annullamento/consumo, focus dei dialoghi, quattro larghezze, SVG locali e navigazione offline. Gli screenshot di verifica sono generati in `test-results/` e non versionati. Non sono ancora coperti Safari reale, VoiceOver/TalkBack o una tastiera virtuale fisica.

## Struttura e origine grafica

L’identità corrente usa verde CIBY, bianco e tuorlo, con Bricolage Grotesque per i titoli e Source Sans 3 per i contenuti. I font sono locali e inclusi nella cache offline. Riferimenti e regole sono nella [guida all’identità](../design/identita-visiva.md).

- `src/App.tsx`: navigazione e schermate della prima iterazione.
- `src/components.tsx`: pulsanti, immagini e dialoghi accessibili riutilizzabili.
- `src/domain.ts`: scorte, piano, ricette e vincoli; separato dalla grafica.
- `src/style.css`, `src/tokens.css`: CSS responsivo; `../design/identity.css` condivide colori e caratteri con il sito. I valori sono documentati in `../design/design-tokens.json`.
- `public/assets`: SVG esportati dal Figma, conservati localmente senza URL temporanei; mappatura in `../design/figma-export.json`.
- `scripts/build-sw.mjs`: cache offline essenziale generata dalla build, senza servizi esterni.

Scelte rispetto al mockup: nessuna finta barra di stato del telefono, contenuti scorrevoli al posto di altezze rigide, controlli reali per scorte e porzioni, stato vuoto e recupero dagli errori. I riferimenti originali sono Oggi `2:70`, Dispensa `2:73`, Fridgy `2:76`, Cambio di programma `2:79`.

## Prossima iterazione

1. Fare provare tre compiti: scegliere una cena, correggere un ingrediente mancante, rinviare il pasto. Annotare esitazioni, errori e comprensione di cosa viene salvato.
2. Decidere se partire da ingrediente, pasto o conversazione; verificare se la distinzione Dispensa/Pasti è chiara.
3. Rendere più chiara l'assegnazione delle quantità residue e progettare ingredienti sconosciuti, pasti multipli e preferenze. Evitare di espandere tutte queste funzioni prima dei riscontri.
4. Valutare solo dopo un vero modello AI. Un adapter può sostituire la demo di Fridgy; un eventuale piccolo proxy server custodirebbe la chiave. La prima versione non richiede un backend o costi API.

## Iterazione: alimenti liberi, ricettario e messaggi

In Dispensa il comando Aggiungi alimento è ora subito visibile, con un pannello dedicato. Il nome è libero, con suggerimenti facoltativi, e le unità includono pezzi, g, kg, ml, l e confezioni. Le ricette dimostrative non convertono automaticamente queste unità: per il matching esistente il riso va ancora indicato in grammi e uova/zucchine/pomodori in pezzi.

I messaggi hanno autori visibili: Tu, a destra su sfondo melanzana, e Fridgy · Demo AI, a sinistra su sfondo chiaro. La logica conversazionale non è cambiata.

Da Oggi o Pasti si apre un catalogo curato di 18 ricette italiane da GialloZafferano, Cucchiaio d’Argento e La Cucina Italiana. Titoli, ingredienti e sintesi sono in italiano. Ogni scheda conserva dosi della fonte, numero di persone, tempi indicativi con note su ammollo/riposo e il link alla preparazione completa. Le sintesi sono originali CIBY; non sono riprodotti testi integrali o fotografie dei siti. Le quantità non vengono adattate al piano e non generano consumi automatici.

`node scripts/import-recipes.mjs` ora verifica il catalogo senza modificarlo e senza rete. L'importazione automatica della categoria Italian di TheMealDB è stata ritirata perché includeva adattamenti americani. Per aggiungere una ricetta occorre selezionare una fonte, controllare ingredienti/dosi e scrivere una sintesi originale. Le schede sono incluse nella build offline, mentre la fonte esterna richiede internet.

### Da sviluppare dopo i riscontri

- Traduzione controllata degli ingredienti, sinonimi e conversione delle quantità. Separare l'anagrafica degli alimenti dalle scorte specifiche.
- Tempi, porzioni e attrezzatura verificati per le ricette importate. Se manca un dato, conservarlo come sconosciuto.
- Raffinare il confronto catalogo-dispensa con quantità compatibili e gestione dei residui: il riconoscimento dei nomi non garantisce che le scorte bastino.
- Collegamento di Fridgy a un LLM tramite un adapter, con contesto di scorte e ricette. Un piccolo endpoint server per Gemini custodirebbe la chiave e gestirebbe quote/errori; non serve un database o un sistema di login. Non inserire chiavi in variabili VITE_ o nel codice frontend.
- Alternativa locale: Ollama sul Mac, accessibile all'app tramite un piccolo proxy; nessuna chiave per modelli locali, ma velocità e modello dipendono dall'hardware. Il telefono non esegue il modello: il Mac deve restare acceso e raggiungibile.

### Se il telefono non raggiunge la demo

La verifica sul Mac ha confermato il server in ascolto su tutte le interfacce alla porta 5173 e una risposta HTTP 200. Questo non verifica il tragitto dal telefono. Usare l'indirizzo Network corrente, tenere acceso il Mac e lasciare attivo il server. Se non si apre: controllare che entrambi i dispositivi siano sulla rete principale (non guest), che una VPN non blocchi l'accesso LAN e che il firewall consenta connessioni in ingresso a Node. Non modificare router o disabilitare globalmente il firewall. In caso di isolamento della rete, il passo più semplice sarà una preview statica HTTPS condivisa, da pubblicare in un secondo momento.

## Pasti e grafica: seconda correzione

Da Pasti è sempre disponibile “Esplora ricette e cambia pasto”, anche se il pasto corrente ha ingredienti mancanti. Le ricette del catalogo possono sostituire il piano salvato, essere rilette e rinviate. Il piano persiste al ricaricamento. Le dosi e i tempi si riferiscono alla fonte, non al piano personale; il consumo automatico resta disattivato. Non vengono sottratte quantità ricavate da testo libero.

Il catalogo riconosce alcuni sinonimi comuni italiano/inglese (per esempio pasta, pomodori, uova) e ordina prima le ricette con ingredienti riconosciuti; questo è un aiuto alla consultazione, non una verifica della compatibilità o delle quantità. Non è ancora un motore completo di pianificazione. Fridgy conserva la logica precedente.

Nuove illustrazioni vettoriali originali, con la stessa palette piatta, per pasta, lenticchie, latte, pane, carote, mele, legumi e patate. Un contenitore illustrato sostituisce il frigorifero come immagine generica. Le icone sono ricavate dal nome anche per gli alimenti già salvati.

### Android via USB, sempre locale

Sul Mac sono presenti Android Platform Tools. Se la Wi-Fi continua a bloccare Chrome:

1. Collega Android con un cavo dati e abilita Debug USB nelle Opzioni sviluppatore; autorizza il Mac sul telefono.
2. Lascia aperto `npm run dev` nel terminale della cartella app.
3. In un secondo terminale nella stessa cartella esegui `npm run phone:usb`.
4. Apri **http://localhost:5173** in Chrome sul telefono: il collegamento USB inoltra quella porta al Mac, senza un link pubblico.

Questo comando non abilita Debug USB e non modifica impostazioni del telefono automaticamente. Non è stato verificato su un telefono fisico collegato. In alternativa, per ulteriori controlli Wi-Fi: verificare anche sul Mac Impostazioni di Sistema → Privacy e sicurezza → Rete locale, per l'app che avvia Node (Codex o Terminale). Il firewall e questa autorizzazione sono controlli diversi.

### Android via USB su Windows

Installare Android SDK Platform Tools ed estrarre l'archivio, oppure usare quelli installati da Android Studio. Collegare un solo telefono con un cavo dati, abilitare Debug USB nelle Opzioni sviluppatore e autorizzare il computer sul telefono. Alcuni dispositivi richiedono anche il driver USB del produttore.

Lasciare attivo `npm.cmd run dev`. In un secondo PowerShell aperto nella cartella `app`, indicare il percorso effettivo di `adb.exe` ed eseguire:

```powershell
# Percorso predefinito se gli SDK sono stati installati con Android Studio:
$env:ADB_PATH = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
# Se Platform Tools è stato estratto altrove, sostituire il percorso sopra.
npm.cmd run phone:usb
```

Se `adb.exe` è già nel PATH, non serve impostare `ADB_PATH`. Aprire `http://localhost:5173` in Chrome sul telefono dopo il messaggio di collegamento riuscito. Il computer e il server devono restare accesi; il collegamento USB non dipende dalla Wi-Fi. La procedura Windows e il collegamento fisico USB non sono stati verificati su hardware Windows/Android.

## Iterazione: dal ricettario alla spesa

Il ricettario permette di salvare ricette preferite, filtrare quelle con ingredienti riconosciuti in dispensa e confrontare gli ingredienti di ogni ricetta con le scorte. I nomi comuni riconosciuti sono mostrati anche in italiano. Il riconoscimento indica la presenza dell'alimento: le quantità e le sostituzioni devono sempre essere verificate dalla persona.

Dal dettaglio si selezionano gli ingredienti da aggiungere alla spesa. La lista è raggiungibile da Oggi o da Dispensa → Spesa. Gli ingredienti uguali vengono raggruppati; le quantità originali delle diverse ricette sono conservate come riferimenti separati e non sommate. Si possono aggiungere anche voci libere con una nota, segnare gli acquisti e rimuovere voci.

Spuntare un acquisto non cambia le scorte. Con “Porta in dispensa” si indicano quantità effettiva, unità e posizione, quindi si conferma con “Salva alimento”. La nuova scorta viene aggiunta e la voce esce dalla spesa nello stesso aggiornamento; chiudere il modulo lascia invariati entrambi. Le scorte già presenti non vengono sovrascritte.

Preferiti e spesa persistono in questo browser e sono disponibili nella build offline. I salvataggi precedenti vengono letti conservando dispensa e pasto; le nuove liste partono vuote. “Ripristina esempio” cancella anche preferiti e spesa dopo la conferma. Fridgy conserva il suo dialogo dimostrativo.

### Compiti per una prossima prova HCI

1. Trovare una ricetta con un alimento in dispensa, salvarla tra i preferiti e ritrovarla.
2. Controllare cosa manca, scegliere cosa comprare e aprire la lista della spesa.
3. Segnare un acquisto e registrare la quantità effettiva in dispensa. Verificare se è chiaro quando le scorte cambiano.

I passi successivi sono pianificare più pasti, completare il vocabolario degli ingredienti e valutare un assistente AI dopo aver raccolto i riscontri su questi flussi.

## Ricettario italiano: selezione delle fonti

Il nuovo catalogo sostituisce tutte le 12 precedenti schede, comprese Alfredo con panna, Chicken Alfredo Primavera e altri adattamenti non adatti alla selezione italiana. Include carbonara, aglio olio e peperoncino, pasta e lenticchie, pasta e patate, frittata di zucchine, panzanella, cacio e pepe, gricia, risotto alla milanese, parmigiana, minestrone, lasagne alla bolognese, polpette al sugo, pasta e ceci, Norma, ribollita, spaghetti al pomodoro e pasta e fagioli lombarda.

I piatti non sono presentati come un'unica versione canonica: si indica la specifica fonte e, quando utile, la regione. Per esempio la pasta e lenticchie selezionata contiene pancetta; non è etichettata vegetariana. Il confronto con la dispensa distingue ingredienti e preparazioni diverse.

Se un vecchio salvataggio conteneva un pasto TheMealDB ritirato, il pasto torna da scegliere; scorte, lista della spesa e storico vengono conservati. I preferiti ritirati vengono rimossi. Le note di spesa già aggiunte restano dati della persona. Gli ID delle nuove schede sono stabili e separati da quelli ritirati.

## Bisogni C2 e percorsi di presentazione

- **B01:** data facoltativa “da consumare entro”, etichette temporali e striscia “Da usare presto”. La priorità manuale precede l'ordinamento per data. Una data passata invita a verificare e non certifica la sicurezza dell'alimento.
- **B02/B03:** confronto delle preparazioni dimostrative per porzioni, tempo, impegno e quantità mancanti, con accesso al rinvio. Una preparazione oltre il tempo indicato non è selezionabile. Scegliere o rinviare non consuma le scorte.
- **B04:** la lista della spesa mostra le scorte già presenti con nome riconosciuto; l'avviso lascia alla persona la decisione di comprare.
- **Ultimi 7 giorni:** solo le conferme di consumo alimentano lo storico. Gli alimenti prioritari contati sono quelli effettivamente sottratti, senza duplicare la stessa conferma.

L'introduzione di tre schermate è rivedibile dalle opzioni M. Su desktop i percorsi di Marta, Gianfranco e Luca aprono le relative interazioni senza ripristinare i dati della persona. Il confronto usa dodici ricette dimostrative con quantità calcolabili; il catalogo italiano ne contiene 18 con dosi della fonte.

## Iterazione: settimana, ricettario locale ed esito degli alimenti

- **Ricettario dimostrativo ampliato:** dodici preparazioni in italiano con tempo, impegno e dosi per una o due persone (fra cui pasta al pomodoro, cous cous e zucchine, bowl di riso e pollo, caprese, zuppa di lenticchie). Gli ingredienti riconosciuti sono in `ingredients` di `src/domain.ts`: nome, unità attesa e grafie accettate. Il dettaglio di una preparazione mostra anche ingredienti presenti e mancanti.
- **Confronto:** filtro “Solo senza carne e pesce”, basato sugli ingredienti elencati e non una garanzia dietetica; le preparazioni a cui manca qualcosa sono raccolte in un elenco richiudibile.
- **Pasti → Settimana (B03/B04):** sette giorni con pranzo e cena. Si sceglie una preparazione per un’occasione, la si sposta o la si toglie senza toccare le scorte. “Cosa serve per i pasti previsti” somma i fabbisogni, incluso il prossimo pasto, e porta i mancanti nella lista della spesa; “Ancora senza un pasto” mostra le scorte non assegnate. Le scorte cambiano solo con “Ho cucinato” e la conferma.
- **Esito degli alimenti rimossi:** alla rimozione si indica “L’ho finito” o “L’ho buttato”. Il riepilogo degli ultimi 7 giorni riporta i due conteggi. È un dato dichiarato dalla persona.

La scelta per la settimana considera le quantità al netto dei pasti già previsti. Sono conteggiati solo gli alimenti che il ricettario dimostrativo riconosce con l’unità attesa (per esempio pasta e riso in grammi). Fridgy non è stato modificato, salvo la nota sul tempo del riso mostrata ora solo per le preparazioni che lo contengono.

## Fridgy con un modello AI gratuito

Fridgy può rispondere con un vero modello linguistico, senza backend e senza costi. Senza chiave resta la demo a regole, che fa anche da riserva se il servizio non risponde.

### Come lo attiva ogni componente del gruppo

Ognuno usa **la propria chiave**: nessuno usa quella di un altro e la chiave non entra mai nel repository o nella build. Il servizio consigliato è **Groq**: registrazione gratuita senza carta di credito, risposte molto rapide e modelli aperti che seguono bene le istruzioni in italiano. Gemini e OpenRouter restano disponibili come alternative.

**1. Crea la chiave Groq (una volta sola)**

1. Vai su [console.groq.com/keys](https://console.groq.com/keys) e accedi (Google, GitHub o email).
2. **Create API Key**, dai un nome (per esempio `ciby`) e copia la chiave: inizia con `gsk_` e Groq la mostra una sola volta.

**2. Salvala nel file personale (una volta per computer)**

Dalla cartella principale della repository:

```sh
cp secrets/fridgy.env.example secrets/fridgy.local.env
```

Su Windows (PowerShell):

```powershell
Copy-Item secrets\fridgy.env.example secrets\fridgy.local.env
```

Apri `secrets/fridgy.local.env` e incolla la chiave dopo `FRIDGY_API_KEY=`:

```sh
FRIDGY_PROVIDER=groq
FRIDGY_API_KEY=gsk_la-tua-chiave
FRIDGY_MODEL=
```

`FRIDGY_MODEL` può restare vuoto: l'app sceglie il modello consigliato fra quelli disponibili per la chiave. Per Gemini usare `FRIDGY_PROVIDER=gemini` con una chiave di [Google AI Studio](https://aistudio.google.com/apikey); per OpenRouter `FRIDGY_PROVIDER=openrouter`.

Il file `secrets/fridgy.local.env` è escluso da Git (`.gitignore`): **non va mai committato, condiviso o incollato in chat**. Prima di un commit, `git status` non deve mostrarlo.

**3. Avvia l'app**

```sh
cd app
npm run dev
```

Aprendo l'indirizzo Local, Fridgy è già attivo: la scheda mostra “AI attiva · … · chiave dal file locale”. Non serve reinserire la chiave a ogni sessione. Il file viene riletto a ogni apertura della pagina, quindi cambiare chiave non richiede di riavviare il server. Il modello scelto in **Impostazioni AI** resta salvato finché la chiave nel file non cambia.

**Come funziona e cosa resta protetto**

- Il server di sviluppo legge il file tramite un piccolo plugin (`scripts/fridgy-local-key.mjs`) e lo consegna solo alle richieste che arrivano dallo stesso computer.
- Il plugin esiste solo con `npm run dev`: `npm run build`, `npm run preview` e il sito pubblicato non contengono né la chiave né il punto di accesso al file.
- Un telefono collegato alla stessa Wi-Fi (indirizzo Network) non riceve la chiave: lì si incolla a mano in **Fridgy → Attiva l’AI gratuita**, e resta salvata in quel browser. Con il collegamento USB (`npm run phone:usb`) il telefono passa da `localhost` e la riceve come il computer.
- I test automatici non leggono mai il file e usano risposte simulate.
- Non mettere la chiave in variabili `VITE_*`, nel codice o in `.env` dentro `app/`: finirebbe nei file pubblicati.

**Senza file**

Si può sempre usare **Fridgy → Attiva l’AI gratuita**: scegliere il servizio, incollare la chiave, **Verifica la chiave**, **Prova modello**, poi **Attiva Fridgy con AI**. In questo caso la chiave resta solo in quel browser (`localStorage`, voce `ciby-fridgy`). Indirizzi diversi (`localhost`, `127.0.0.1`, indirizzo Network) sono browser distinti per il salvataggio: è uno dei motivi per cui la chiave sembrava sparire tra una sessione e l'altra.

“Rimuovi la chiave e torna alla demo” cancella la copia nel browser; se il file locale è presente, al successivo avvio Fridgy si riattiva. Per disattivarlo del tutto, svuotare `FRIDGY_API_KEY` nel file.

### Che cosa riceve il modello

A ogni messaggio il browser invia direttamente al servizio scelto: la conversazione recente e un riepilogo aggiornato di dispensa (quantità, posizione, priorità, giorni alla data indicata), prossimo pasto, pasti della settimana, mancanti, scorte senza un pasto, lista della spesa, preferiti, ultimi pasti cucinati e alimenti buttati, più il ricettario dimostrativo con la fattibilità di ogni preparazione. Il riepilogo è costruito in `userContext` (`src/fridgy.ts`), dove si trova anche il prompt.

Il modello non modifica nulla. Può allegare proposte (`[[ricetta:…]]`, `[[settimana:…]]`, `[[spesa:…]]`) che l'app mostra come pulsanti: aprire una preparazione, metterla in programma, aggiungere un alimento alla spesa. Ogni proposta si applica solo con un tocco; quelle non valide vengono scartate.

### Limiti da conoscere

- I limiti gratuiti (richieste al minuto e al giorno) dipendono dal servizio e cambiano nel tempo: controllarli nella propria console. Al superamento Fridgy lo comunica e risponde in modalità demo.
- Nel piano gratuito alcuni servizi possono usare le richieste per migliorare i propri prodotti: per la demo usare dati di esempio.
- Le risposte di un modello possono contenere errori. Il prompt chiede di partire solo dai dati della persona e di non valutare sicurezza degli alimenti, allergie o diete, ma non è una garanzia.
- I flussi automatici usano un servizio simulato (`tests/fridgy-ai.spec.ts`): la prova con una chiave reale va fatta a mano.

### Alternativa valutata: una chiave unica dietro un proxy

Un piccolo servizio (per esempio una funzione serverless gratuita) potrebbe custodire una sola chiave e far funzionare Fridgy senza configurazione per chiunque apra il sito. Richiede però un deploy da mantenere, concentra i limiti gratuiti su un'unica chiave e chi la possiede risponde dell'uso di tutti. Per un prototipo di corso la chiave personale nel browser è più semplice e non espone nessuno; il proxy resta un'opzione se servirà una demo pubblica senza configurazione.

## Fridgy: verifica della connessione e recupero errori

La lettura dell'elenco modelli non certifica che un modello possa generare risposte o che abbia quota disponibile. La configurazione aggiorna automaticamente l’elenco quando si riaprono impostazioni già salvate. “Aggiorna modelli” carica le alternative senza generare risposte. “Prova modello” invia una richiesta minima (“Rispondi soltanto OK.”) al modello scelto prima di abilitare l’attivazione. Cambiando modello occorre ripetere “Prova modello”. Le prove di configurazione non inviano la dispensa.

Per risposte HTTP 502/503/504 si esegue un solo tentativo aggiuntivo sullo stesso servizio e modello, rispettando Retry-After se breve; non si cambia modello o servizio automaticamente. Un 503 persistente è indicato come indisponibilità temporanea. Gli errori di chiave, quota, modello assente e connessione sono distinti. Dopo un errore la risposta di ripiego è etichettata come demo e il comando “Riprova con AI” consente di ripetere la domanda senza duplicarla. L'elenco modelli privilegia versioni stabili rispetto alle preview e modelli Flash-Lite rispetto ai più pesanti: non garantisce quota gratuita per il progetto. Verificare le quote nel servizio scelto.

Fonte tecnica: [Google, errori API](https://ai.google.dev/gemini-api/docs/api-errors?hl=en). Un sovraccarico del fornitore può persistere anche con una chiave valida. La verifica automatica locale usa risposte simulate, senza una chiave reale o richieste al conto della persona.

## Aspetto e modalità notte

Da M → Aspetto si sceglie Automatico, Chiaro oppure Notte. Automatico segue il sistema anche quando il tema del dispositivo cambia a pagina aperta. La preferenza è indipendente dalle scorte e viene salvata nel browser; si applica anche a dialoghi, ricettario, settimana e chat. Non serve un servizio esterno. La preferenza è applicata prima del rendering per evitare un lampo chiaro all'apertura.

### Cambio modello e palette notte

Il modello resta selezionabile anche durante una prova: la risposta tardiva della prova precedente non può validare o sovrascrivere la nuova scelta. Se l'elenco non si carica, “Inserisci un ID modello manualmente” consente di provare un altro ID senza eliminare la chiave. Non vengono scelte alternative automaticamente e la disponibilità/quotazione del modello dipende dal servizio.

Il tema notte usa nero bluastro (#090d14), pannelli antracite (#131b28), selezioni blu notte (#1c293d), accenti azzurri e testo bianco/grigio. Non usa superfici verdi; le illustrazioni alimentari conservano i colori originali.

Nelle impostazioni Fridgy, “Copia chiave” copia anche la chiave già salvata. Rimane mascherata finché non si usa “Mostra chiave”. Se il browser non permette la copia automatica (per esempio su HTTP locale), viene selezionata per la copia manuale. La copia non rimuove né risalva la chiave e non la inserisce nei messaggi di stato.

## Iterazione: dispensa dalla spesa, conversazione e scenari di prova

- **Porta tutto in dispensa:** nella lista della spesa, “Porta in dispensa gli acquistati” (o “Porta tutta la lista in dispensa” se nulla è spuntato) apre un riepilogo. Per ogni voce si conferma la quantità comprata davvero, mentre unità e posizione sono proposte (per esempio riso in grammi in dispensa, pollo in grammi in frigo) e la data è facoltativa. Le quantità delle ricette compaiono solo come riferimento. Con un'unica conferma gli alimenti entrano in dispensa ed escono dalla lista; le scorte già presenti non vengono modificate. Chiudere la finestra non cambia nulla.
- **−1 in dispensa:** accanto agli alimenti contati a pezzi o confezioni, “−1” segna subito un'unità usata senza aprire il modulo. A zero l'alimento esce dalle scorte e viene contato come finito nel riepilogo degli ultimi 7 giorni.
- **Conversazione salvata:** gli ultimi 40 messaggi con Fridgy, e lo stato dei pulsanti già usati, restano dopo un ricaricamento della pagina. “Ripristina esempio” e il cambio di impostazioni AI ripartono da capo.
- **Scenari per le prove (M → Scenari per le prove):** tre situazioni costruite sulle personas C2, sempre uguali a ogni avvio: Marta (B01, mozzarella in scadenza da collocare), Gianfranco (B02, cena in 15 minuti dopo le lezioni), Luca (B03/B04, manca il pollo per la bowl di stasera). Caricare uno scenario chiede conferma, sostituisce i dati del browser e mostra il compito in Oggi finché non viene nascosto.
