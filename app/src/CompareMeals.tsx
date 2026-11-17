import { useState } from "react";
import { Button, Modal } from "./components";
import { compareOptions, type Food, type Plan, type RecipeId } from "./domain";

/**
 * B02/B03: confront feasible preparations with postponing the current meal.
 * Nothing changes until the person picks an option.
 */
export default function CompareMeals({
  foods,
  plan,
  initialServings,
  onChoose,
  onPostpone,
  onClose,
  title = "Confronta le opzioni",
  intro = "Adattare o rinviare? Vedi cosa serve per ogni preparazione prima di scegliere. Le scorte non cambiano finché non cucini.",
  chooseLabel = "Scegli questa",
  allowMissing = false,
}: {
  allowMissing?: boolean;
  title?: string;
  intro?: string;
  chooseLabel?: string;
  foods: Food[];
  plan: Plan | null;
  initialServings: number;
  onChoose: (id: RecipeId, servings: number) => void;
  onPostpone?: () => void;
  onClose: () => void;
}) {
  const [servings, setServings] = useState(initialServings);
  const [maxTime, setMaxTime] = useState(30);
  const [vegOnly, setVegOnly] = useState(false);
  const options = compareOptions(foods, servings)
    .filter((o) => !vegOnly || o.veg)
    .sort(
      (a, b) =>
        Number(b.ok) - Number(a.ok) ||
        b.usesSoon.length - a.usesSoon.length ||
        a.time - b.time,
    );
  const feasible = options.filter((o) => o.ok);
  const blocked = options.filter((o) => !o.ok);
  const current = plan && !plan.consumed ? plan.recipe : null;
  function card(o: (typeof options)[number]) {
    const tooLong = maxTime < 30 && o.time > maxTime;
    return (
      <li
        key={o.id}
        className={`compare-card ${o.ok && !tooLong ? "feasible" : "blocked"}`}
      >
        <div className="compare-head">
          <div>
            <strong>{o.title}</strong>
            <small>
              {o.time} min · {o.effort} · {o.steps.length} passaggi
            </small>
          </div>
          {current === o.id && <span className="pill">Previsto</span>}
        </div>
        <ul className="compare-ingredients">
          {o.items.map((i) => (
            <li key={i.key} className={i.ok ? "ok" : "missing"}>
              <span aria-hidden="true">{i.ok ? "✓" : "!"}</span>
              {i.name}: {i.need} {i.unit}
              <small>
                {i.ok
                  ? ` · ne hai ${i.have}`
                  : ` · ne mancano ${i.need - i.have}`}
              </small>
            </li>
          ))}
        </ul>
        {o.usesSoon.length > 0 && (
          <p className="compare-soon">Usa per primi: {o.usesSoon.join(", ")}</p>
        )}
        {tooLong && (
          <p className="compare-warn">Supera il tempo che hai indicato.</p>
        )}
        <Button
          secondary={current === o.id || !o.ok}
          disabled={(!o.ok && !allowMissing) || tooLong}
          onClick={() => onChoose(o.id, servings)}
        >
          {!o.ok
            ? allowMissing && !tooLong
              ? "Pianifica: il resto è da comprare"
              : "Ingredienti insufficienti"
            : tooLong
              ? "Tempo insufficiente"
              : current === o.id
                ? `Tieni, per ${servings === 1 ? "una persona" : "due"}`
                : chooseLabel}
        </Button>
      </li>
    );
  }
  return (
    <Modal title={title} onClose={onClose}>
      <p className="compare-intro">{intro}</p>
      <div className="compare-controls">
        <div className="segmented" role="group" aria-label="Porzioni">
          {[1, 2].map((n) => (
            <button
              key={n}
              aria-pressed={servings === n}
              onClick={() => setServings(n)}
            >
              {n === 1 ? "Solo per me" : "Per due"}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Tempo disponibile">
          {[15, 20, 30].map((n) => (
            <button
              key={n}
              aria-pressed={maxTime === n}
              onClick={() => setMaxTime(n)}
            >
              {n === 30 ? "30+ min" : `${n} min`}
            </button>
          ))}
        </div>
        <label className="compare-veg">
          <input
            type="checkbox"
            checked={vegOnly}
            onChange={(e) => setVegOnly(e.target.checked)}
          />
          <span>
            Solo senza carne e pesce
            <small>Dagli ingredienti elencati: verifica sempre.</small>
          </span>
        </label>
      </div>
      <p className="compare-count" role="status">
        {feasible.length}{" "}
        {feasible.length === 1
          ? "preparazione possibile"
          : "preparazioni possibili"}{" "}
        con le scorte di ora
      </p>
      <ul className="compare-list">
        {feasible.map(card)}
        {current && onPostpone && (
          <li className="compare-card postpone">
            <div className="compare-head">
              <div>
                <strong>Rinvia il pasto previsto</strong>
                <small>Domani a pranzo o a cena</small>
              </div>
            </div>
            <p className="footnote">
              Gli ingredienti restano in dispensa con una nuova occasione
              concreta. Vedrai cosa resta prima di confermare.
            </p>
            <Button secondary onClick={onPostpone}>
              Vai al rinvio
            </Button>
          </li>
        )}
      </ul>
      {blocked.length > 0 && (
        <details className="compare-more">
          <summary>
            {blocked.length === 1
              ? "1 preparazione a cui manca qualcosa"
              : `${blocked.length} preparazioni a cui manca qualcosa`}
          </summary>
          <ul className="compare-list">{blocked.map(card)}</ul>
        </details>
      )}
      <p className="footnote">
        Ricettario dimostrativo con quantità calcolabili. Olio e sale da
        verificare.
      </p>
    </Modal>
  );
}
