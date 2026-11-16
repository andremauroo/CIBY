# Identità visiva CIBY

Identità adottata il 16 novembre 2026: verde profondo, bianco e tuorlo. Le regole valgono per prodotto, sito e presentazioni, mantenendo la struttura adatta a ciascun supporto. Il [kit Figma](https://www.figma.com/design/uoudiPCsc9d5dsuUuzOxTJ?node-id=2-29) conserva la tavola editabile, le variabili e gli stili di testo.

## Colori

| Ruolo | Colore | Uso |
|---|---|---|
| Verde CIBY | `#173A30` | Marchio, titoli, testo, selezioni |
| Bianco | `#FFFFFF` | Superficie principale e testo sul verde |
| Fondo discreto | `#F3F7F4` | Riepiloghi e separazione di aree |
| Testo secondario | `#53685D` | Informazioni di supporto e fonti |
| Linea | `#CED9D1` | Separatori decorativi |
| Tuorlo | `#F1C75B` | Azione principale e marchio sulla copertina verde |

Il tuorlo richiede testo verde. Il testo bianco sul tuorlo non raggiunge un contrasto sufficiente. I campi usano contorni più scuri (`#53685D`) quando il bordo serve a riconoscerli. Errori e avvisi hanno colori semantici separati e un’indicazione testuale.

Contrasti calcolati: verde/bianco 12,47:1, secondario/bianco 5,99:1, secondario/fondo 5,54:1 e verde/tuorlo 7,75:1. Le singole coppie superano 4,5:1 per testo normale; questo controllo non certifica da solo l’accessibilità dell’intera interfaccia.

## Caratteri e marchio

- **Bricolage Grotesque 600–700** per CIBY e titoli.
- **Source Sans 3 400–700** per testo, quantità, pulsanti e fonti, con 600 per l’enfasi ordinaria.
- Corpo di riferimento nell’app: 16 px, interlinea 1,5. Le quantità possono usare cifre tabulari.
- Il nome si scrive **CIBY**, mantenendo la proposta di valore: «Con CIBY scegli cosa preparare con quello che hai, anche quando cambiano i programmi.»

Il [marchio vettoriale](assets/ciby-wordmark.svg) conserva il disegno del carattere anche dove non si possono incorporare font, come il README di GitHub. L’icona dell’app riprende la C dello stesso carattere, su verde con un punto tuorlo.

I font web e le licenze OFL sono in `app/public/fonts`. I PDF incorporano i caratteri; per modificare il PowerPoint usando la stessa impaginazione occorrono le due famiglie installate.

## Applicazione ai supporti

**App e sito.** Superfici prevalentemente bianche, titoli verdi, un’azione principale in tuorlo per contesto. Focus visibile, controlli comodi da toccare e informazioni che non dipendono dal solo colore. Le schermate dell’app mantengono i flussi e i dati già previsti.

**Presentazioni.** Copertina verde, CIBY in tuorlo, titoli e contenuti chiari. Pagine interne bianche, titoli allineati a sinistra, testo e fonti nelle griglie esistenti. Tabelle, grafici e diagrammi mantengono dati e significato. Le date delle consegne documentano le rispettive attività, anche dopo l’aggiornamento grafico.

**Documentazione di ricerca.** Fotografie, screenshot, elaborati originali dei colleghi e materiali delle interviste conservano l’aspetto delle fonti. Non vengono uniformati retroattivamente alla nuova grafica.

**Wireframe C3.** Restano in bianco e nero, secondo il compito. La fedeltà richiesta prevale sui colori del marchio.

## Riferimenti condivisi

[design-tokens.json](design-tokens.json) descrive i valori; [identity.css](identity.css) li applica a sito e frontend. Il concept Figma precedente rimane una testimonianza della prima esplorazione grafica, come indicato nel [README del design](README.md).
