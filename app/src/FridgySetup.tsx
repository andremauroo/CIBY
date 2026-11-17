import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "./components";
import {
  FridgyError,
  listModels,
  testFridgyModel,
  providers,
  type FridgySettings,
  type ProviderId,
} from "./fridgy";

/**
 * Each person connects their own free key. It is kept in this browser only:
 * it is not part of the project files and is never sent to CIBY.
 */
export default function FridgySetup({
  current,
  fromFile = false,
  onSave,
  onClose,
}: {
  current: FridgySettings | null;
  fromFile?: boolean;
  onSave: (settings: FridgySettings | null) => void;
  onClose: () => void;
}) {
  const [provider, setProvider] = useState<ProviderId>(
    current?.provider || "groq",
  );
  const [key, setKey] = useState(current?.key || "");
  const keyInput = useRef<HTMLInputElement>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [models, setModels] = useState<string[]>(
    current ? [current.model] : [],
  );
  const [model, setModel] = useState(current?.model || "");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const revision = useRef(0);
  const info = providers[provider];

  // A saved setting is only one choice, never the available model list.
  useEffect(() => {
    if (current?.key)
      void refreshModels(current.provider, current.key, current.model);

    return () => {
      revision.current++;
    };
  }, []);

  async function refreshModels(
    service = provider,
    apiKey = key,
    keepModel = model,
  ) {
    const token = ++revision.current;
    setLoading(true);
    setTesting(false);
    setVerified("");
    setStatus("Aggiorno l’elenco dei modelli…");
    try {
      const found = await listModels({ provider: service, key: apiKey });
      if (token !== revision.current) return;
      setModels(found);
      setModel(found.includes(keepModel) ? keepModel : found[0] || "");
      setStatus(
        found.length
          ? `${found.length} modelli trovati. Scegli un’alternativa e premi Prova modello. La presenza nell’elenco non garantisce quota gratuita.`
          : "Nessun modello chat trovato. Puoi inserire un ID modello manualmente e provarlo.",
      );
    } catch (error) {
      if (token !== revision.current) return;
      setStatus(
        (error instanceof FridgyError
          ? error.message
          : "Elenco non disponibile.") +
          " Puoi inserire un altro ID modello manualmente.",
      );
    } finally {
      if (token === revision.current) setLoading(false);
    }
  }
  function changeModel(value: string) {
    revision.current++;
    setLoading(false);
    setTesting(false);
    setModel(value.trim());
    setVerified("");
    setStatus("Prova questo modello prima di attivarlo.");
  }
  async function probe() {
    const token = ++revision.current;
    const chosen = model;
    setTesting(true);
    setVerified("");
    setStatus(
      "Provo il modello. Puoi sceglierne un altro anche durante l’attesa…",
    );
    try {
      await testFridgyModel({ provider, key: key.trim(), model: chosen });
      if (token !== revision.current) return;
      setVerified(chosen);
      setStatus("Prova riuscita. Puoi attivare Fridgy con questo modello.");
    } catch (error) {
      if (token !== revision.current) return;
      setStatus(
        error instanceof FridgyError ? error.message : "Prova non riuscita.",
      );
    } finally {
      if (token === revision.current) setTesting(false);
    }
  }
  function invalidate() {
    revision.current++;
    setLoading(false);
    setTesting(false);
    setVerified("");
    setModels([]);
    setModel("");
    setStatus("");
  }

  async function copyKey() {
    const value = key.trim();
    if (!value) return;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setCopyStatus("Chiave copiata negli appunti.");
    } catch {
      // Local HTTP often has no Clipboard API. Copy from the focused input
      // as part of the person's click; otherwise offer explicit manual selection.
      const input = keyInput.current;
      if (!input) return;
      input.type = "text";
      input.focus();
      input.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        /* manual fallback below */
      }
      if (copied) {
        input.type = keyVisible ? "text" : "password";
        setCopyStatus("Chiave copiata negli appunti.");
      } else {
        setKeyVisible(true);
        setCopyStatus(
          "Copia automatica non disponibile. La chiave è selezionata: usa Copia o Ctrl+C (⌘C su Mac).",
        );
      }
    }
  }

  return (
    <Modal title="Fridgy con AI" onClose={onClose}>
      <p>
        Fridgy può usare un modello AI con quota gratuita, se disponibile nel
        tuo progetto. Ogni persona collega la propria chiave personale: resta
        solo in questo browser e non viene condivisa con il gruppo né salvata
        nel progetto.
      </p>
      {fromFile && (
        <p className="fridgy-file-note">
          Chiave caricata da <code>secrets/fridgy.local.env</code>. Il modello
          che scegli qui resta salvato finché non cambi la chiave nel file. Se
          la rimuovi, torna al prossimo avvio: per disattivarla svuota il file.
        </p>
      )}
      <form
        className="food-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (model && verified === model)
            onSave({ provider, key: key.trim(), model });
        }}
      >
        <label>
          Servizio
          <select
            value={provider}
            onChange={(e) => {
              invalidate();
              setProvider(e.target.value as ProviderId);
            }}
          >
            {(Object.keys(providers) as ProviderId[]).map((id) => (
              <option key={id} value={id}>
                {providers[id].label}
              </option>
            ))}
          </select>
        </label>
        <p className="footnote">
          {info.note}{" "}
          <a href={info.keyUrl} target="_blank" rel="noreferrer">
            Crea la tua chiave gratuita
          </a>
          , poi incollala qui.
        </p>
        <label>
          La tua chiave API
          <input
            ref={keyInput}
            type={keyVisible ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={key}
            placeholder={info.keyHint}
            onChange={(e) => {
              invalidate();
              setKey(e.target.value);
              setCopyStatus("");
            }}
          />
        </label>
        <div className="key-actions">
          <button
            type="button"
            className="text-button"
            disabled={!key.trim()}
            onClick={copyKey}
          >
            Copia chiave
          </button>
          <button
            type="button"
            className="text-button"
            aria-pressed={keyVisible}
            disabled={!key.trim()}
            onClick={() => setKeyVisible((value) => !value)}
          >
            {keyVisible ? "Nascondi chiave" : "Mostra chiave"}
          </button>
        </div>
        <p className="footnote" role="status">
          {copyStatus}
        </p>
        <Button
          secondary
          disabled={!key.trim() || loading}
          onClick={() => refreshModels()}
        >
          {current ? "Aggiorna modelli" : "Verifica la chiave"}
        </Button>
        <p className="fridgy-setup-status" role="status">
          {status}
        </p>
        <label>
          Modello
          <select value={model} onChange={(e) => changeModel(e.target.value)}>
            {!model && <option value="">Scegli un modello</option>}
            {model && !models.includes(model) && (
              <option value={model}>{model} (salvato o manuale)</option>
            )}
            {models.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <details className="model-manual">
          <summary>Inserisci un ID modello manualmente</summary>
          <label>
            ID modello
            <input
              value={model}
              maxLength={120}
              spellCheck={false}
              autoComplete="off"
              placeholder="ID esatto dal servizio scelto"
              onChange={(e) => changeModel(e.target.value)}
            />
          </label>
          <p className="footnote">
            Utile se l’elenco non si carica. Non aggiunge modelli o quote al tuo
            account: la prova verifica se l’ID è utilizzabile.
          </p>
        </details>
        <Button
          secondary
          disabled={!model || !key.trim() || testing || loading}
          onClick={probe}
        >
          Prova modello
        </Button>
        <Button
          type="submit"
          disabled={
            !model || verified !== model || !key.trim() || testing || loading
          }
        >
          Attiva Fridgy con AI
        </Button>
        {current && (
          <button
            type="button"
            className="text-button"
            onClick={() => onSave(null)}
          >
            Rimuovi la chiave e torna alla demo
          </button>
        )}
      </form>
      <p className="footnote">
        Con l’AI attiva, a ogni messaggio vengono inviati al servizio scelto la
        conversazione e un riepilogo di dispensa, pasti e lista della spesa. Non
        vengono inviati nomi o account. I limiti gratuiti dipendono dal
        servizio.
      </p>
    </Modal>
  );
}
