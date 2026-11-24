# Identità visiva CIBY

L'identità v1 risale al 16 novembre 2026. Il sito v2 pubblicato il 24 novembre introduce una nuova declinazione grafica. L'applicazione e le presentazioni non sono ancora state uniformate alla nuova palette.

## Palette attualmente in uso

| Ruolo | V1 · Presentazioni | Sito v2 | App · Chiaro | App · Notte |
| --- | --- | --- | --- | --- |
| Marchio e titoli | `#173A30` | `#2D5A27` / `#223E2B` | `#17325F` | `#B4CCF7` |
| Sfondo | `#FFFFFF` | `#FAF8F5` | `#F6F8FC` | `#090D14` |
| Superficie secondaria | `#F3F7F4` | `#9FAB90` (sfondo demo) | `#FFFFFF` | `#131B28` |
| Accento | `#F1C75B` | `#F4B942` | `#A9C8FF` | `#95BAFF` |
| Testo | `#173A30` | `#1F2421` | `#14233F` | `#E7EDF6` |
| Testo secondario | `#53685D` | `#525B51` | `#4D5D78` | `#A7B3C6` |

I valori di riferimento e le relative fonti sono in [design-tokens.json](design-tokens.json). La base v1 resta documentata nel [kit Figma](https://www.figma.com/design/uoudiPCsc9d5dsuUuzOxTJ?node-id=2-29) e in [identity.css](identity.css). Il [CSS del sito](../site/site.css), i [token dell'app](../app/src/tokens.css) e il [tema notte](../app/src/theme.css) definiscono le palette effettive delle interfacce.

## Caratteri e marchio

- **Bricolage Grotesque** per il marchio e i titoli.
- **Source Sans 3** per testi, quantità e controlli; il corpo di riferimento dell'app è 16 px.
- **Georgia in corsivo** come accento tipografico nei titoli del sito v2.
- Il nome si scrive **CIBY**. La proposta di valore resta «Con CIBY scegli cosa preparare con quello che hai, anche quando cambiano i programmi».

Il marchio vettoriale conserva il disegno originale in due varianti trasparenti: [verde per fondi chiari](assets/ciby-wordmark.svg) e [salvia per fondi scuri](assets/ciby-wordmark-dark.svg). Il README principale sceglie la variante in base al tema. L'[icona dell'app](../app/public/icon.svg) conserva per ora la C su fondo verde con punto tuorlo della v1.

I [font e le licenze OFL](../app/public/fonts/) sono conservati localmente. La tipografia di base è condivisa tra app e sito.

## Applicazione e direzione futura

La prossima revisione grafica prenderà il sito v2 come riferimento: fondo panna, verdi naturali, accento zafferano e la stessa gerarchia tipografica. L'app manterrà le esigenze di leggibilità, stati semantici, interazione touch e tema notte; le palette corrispondenti dovranno essere definite e verificate prima dell'aggiornamento. Gli stati non devono dipendere soltanto dal colore.

Le presentazioni già consegnate restano documentate nella versione originale. La nuova identità dovrà essere recepita negli elaborati successivi e, se opportuno, nelle eventuali revisioni delle presentazioni precedenti. I wireframe C3 restano in bianco e nero.

[Torna al design](README.md)
