import { useEffect, useRef, useState } from "react";
import { asset } from "./components";

const steps = [
  {
    art: "e9eda.svg",
    kicker: "Dall'alimento",
    title: "Parti da quello che hai.",
    text: "CIBY mette in evidenza gli alimenti da usare per primi: quelli che scegli tu e quelli vicini alla data indicata.",
  },
  {
    art: "8d892.svg",
    kicker: "Al prossimo pasto",
    title: "Scegli cosa è praticabile.",
    text: "Confronta preparazioni per tempo, impegno e ingredienti disponibili, prima di decidere.",
  },
  {
    art: "59bc0.svg",
    kicker: "Anche quando cambia tutto",
    title: "Adatta o rinvia, senza rifare tutto.",
    text: "Se mangi fuori o manca qualcosa, vedi cosa resta da usare e cosa serve comprare. Le scorte cambiano solo quando confermi.",
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const step = steps[i];
  const last = i === steps.length - 1;
  return (
    <dialog
      ref={ref}
      className="onboarding"
      aria-labelledby="onboarding-title"
      onCancel={onDone}
      onClose={onDone}
    >
      <div className="onboarding-art" key={i}>
        <span className="onboarding-blob" />
        <img src={asset(step.art)} alt="" />
      </div>
      <small className="onboarding-kicker">{step.kicker}</small>
      <h2 id="onboarding-title">{step.title}</h2>
      <p>{step.text}</p>
      <div className="onboarding-dots" aria-hidden="true">
        {steps.map((_, n) => (
          <span key={n} className={n === i ? "active" : ""} />
        ))}
      </div>
      <div className="onboarding-actions">
        <button className="text-button" onClick={onDone}>
          Salta
        </button>
        <button
          className="button"
          onClick={() => (last ? onDone() : setI(i + 1))}
        >
          {last ? "Inizia" : "Avanti"}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        Passo {i + 1} di {steps.length}
      </p>
    </dialog>
  );
}
