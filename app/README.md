# CIBY — App, prima iterazione HCI

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
- **Dispensa:** ricerca, filtri, inserimento, modifica, rimozione e priorità decisa dalla persona.
- **Fridgy:** dialogo a regole dichiarato, risposte rapide, tempo e porzioni, esclusione di ingredienti, richieste fuori ambito. Tre ricette dimostrative; nessun LLM o API esterna. Le correzioni in chat non modificano la dispensa.
- **Pasti:** conseguenze del rinvio, cambio di porzioni, conferma e annullamento dell'ultimo spostamento della sessione.
- **Consumo:** solo “Ho cucinato questo pasto” e la conferma successiva sottraggono gli ingredienti. Il consumo non si ripete due volte.

Alimenti e pasto sono salvati in localStorage. Il dialogo e l'annullamento del rinvio restano nella sessione. Nessun account o backend. Browser e dispositivi diversi hanno dati separati; la cancellazione dei dati del sito li rimuove. Il pulsante M apre spiegazioni e ripristino dell'esempio con conferma.

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

- `src/App.tsx`: navigazione e schermate della prima iterazione.
- `src/components.tsx`: pulsanti, immagini e dialoghi accessibili riutilizzabili.
- `src/domain.ts`: scorte, piano, ricette e vincoli; separato dalla grafica.
- `src/style.css`, `src/tokens.css`: CSS responsivo e colori derivati da `../design/design-tokens.json`.
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

Da Oggi o Pasti, il ricettario apre 12 ricette importate da TheMealDB. Si possono cercare per titolo o ingrediente e leggere ingredienti, quantità originali e istruzioni. I contenuti sono quelli originali, prevalentemente in inglese; tempi e porzioni non sono disponibili nei dati strutturati e non vengono inventati. Non sono collegate a Fridgy, ma possono essere scelte come prossimo pasto dalla schermata Pasti. I dati sono inclusi nella build e restano disponibili offline; nessuna richiesta API durante l'uso.

Per aggiornare l'importazione: `node scripts/import-recipes.mjs` dalla cartella app (richiede internet). Chiave di test pubblica 1, prevista per sviluppo/uso didattico: [TheMealDB](https://www.themealdb.com/api.php). Prima di pubblicazioni diverse dalla demo didattica vanno riverificate le condizioni. Importazione limitata alle prime 12 ricette dell'elenco Italian; non è l'intero catalogo e l'appartenenza alla categoria è definita dal fornitore.

### Da sviluppare dopo i riscontri

- Traduzione controllata degli ingredienti, sinonimi e conversione delle quantità. Separare l'anagrafica degli alimenti dalle scorte specifiche.
- Tempi, porzioni e attrezzatura verificati per le ricette importate. Se manca un dato, conservarlo come sconosciuto.
- Abbinamento catalogo-dispensa e scelta di ricette importate nel piano, mantenendo conferma e gestione dei residui.
- Collegamento di Fridgy a un LLM tramite un adapter, con contesto di scorte e ricette. Un piccolo endpoint server per Gemini custodirebbe la chiave e gestirebbe quote/errori; non serve un database o un sistema di login. Non inserire chiavi in variabili VITE_ o nel codice frontend.
- Alternativa locale: Ollama sul Mac, accessibile all'app tramite un piccolo proxy; nessuna chiave per modelli locali, ma velocità e modello dipendono dall'hardware. Il telefono non esegue il modello: il Mac deve restare acceso e raggiungibile.

### Se il telefono non raggiunge la demo

La verifica sul Mac ha confermato il server in ascolto su tutte le interfacce alla porta 5173 e una risposta HTTP 200. Questo non verifica il tragitto dal telefono. Usare l'indirizzo Network corrente, tenere acceso il Mac e lasciare attivo il server. Se non si apre: controllare che entrambi i dispositivi siano sulla rete principale (non guest), che una VPN non blocchi l'accesso LAN e che il firewall consenta connessioni in ingresso a Node. Non modificare router o disabilitare globalmente il firewall. In caso di isolamento della rete, il passo più semplice sarà una preview statica HTTPS condivisa, da pubblicare in un secondo momento.

## Pasti e grafica: seconda correzione

Da Pasti è sempre disponibile “Esplora ricette e cambia pasto”, anche se il pasto corrente ha ingredienti mancanti. Le ricette TheMealDB possono ora sostituire il piano salvato, essere rilette e rinviate. Il piano persiste al ricaricamento. Per queste ricette porzioni/tempi non verificati sono dichiarati e il consumo automatico resta disattivato. Non vengono sottratte quantità ricavate da testo libero.

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
