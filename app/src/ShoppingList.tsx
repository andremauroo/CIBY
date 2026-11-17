import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, FoodImage } from "./components";
import { artFor, type Food } from "./domain";
import { ingredientLabel, normalizeIngredient } from "./catalog";
import { shoppingId, shoppingKey, type ShoppingItem } from "./shopping";
import "./shopping.css";

export default function ShoppingList({
  items,
  onChange,
  onStock,
  onStockAll,
  onExplore,
  foods = [],
}: {
  foods?: Food[];
  items: ShoppingItem[];
  onChange: (items: ShoppingItem[]) => void;
  onStock: (item: ShoppingItem) => void;
  onStockAll?: () => void;
  onExplore: () => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const focusAfterCheck = useRef<string | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const remaining = items.filter((item) => !item.checked);
  const purchased = items.filter((item) => item.checked);
  useEffect(() => {
    if (!focusAfterCheck.current) return;
    document.getElementById(focusAfterCheck.current)?.focus();
    focusAfterCheck.current = null;
  }, [items]);

  function addItem(event: FormEvent) {
    event.preventDefault();
    const cleanedName = name.trim().replace(/\s+/g, " ");
    if (!cleanedName) return;
    const existing = items.find(
      (item) => shoppingKey(item.name) === shoppingKey(cleanedName),
    );
    if (existing) {
      setAnnouncement(
        `${existing.name} è già in lista${existing.checked ? ", tra gli acquistati" : ""}. Puoi modificare la sua nota qui sotto.`,
      );
      return;
    }
    onChange([
      ...items,
      {
        id: shoppingId(),
        name: cleanedName,
        note: note.trim(),
        checked: false,
        sources: [],
      },
    ]);
    setName("");
    setNote("");
    setAnnouncement(`${cleanedName} aggiunto alla lista.`);
  }

  // B04: before buying, show what is already at home (names only).
  function inPantry(item: ShoppingItem) {
    const key = normalizeIngredient(ingredientLabel(item.name));
    return foods.filter(
      (f) =>
        f.quantity > 0 && normalizeIngredient(ingredientLabel(f.name)) === key,
    );
  }
  function row(item: ShoppingItem) {
    const owned = item.checked ? [] : inPantry(item);
    return (
      <li
        className={`shopping-item ${item.checked ? "is-purchased" : ""}`}
        key={item.id}
      >
        <div className="shopping-item-head">
          <label className="shopping-check">
            <input
              id={`shopping-check-${item.id}`}
              type="checkbox"
              checked={item.checked}
              onChange={(event) => {
                focusAfterCheck.current = `shopping-check-${item.id}`;
                onChange(
                  items.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, checked: event.target.checked }
                      : entry,
                  ),
                );
                setAnnouncement(
                  event.target.checked
                    ? `${item.name} acquistato. La dispensa resta da aggiornare.`
                    : `${item.name} di nuovo da comprare.`,
                );
              }}
            />
            <span className="sr-only">Acquistato: </span>
            <strong>{item.name}</strong>
          </label>
          <FoodImage file={artFor(item.name)} />
        </div>
        {owned.length > 0 && (
          <p className="shopping-owned">
            Hai già{" "}
            {owned
              .map((f) => `${f.quantity} ${f.unit} in ${f.place.toLowerCase()}`)
              .join(", ")}
            . Ti serve davvero?
          </p>
        )}
        <label className="shopping-note">
          <span>Nota per {item.name}</span>
          <input
            value={item.note}
            placeholder="Quantità o promemoria"
            maxLength={160}
            onChange={(event) =>
              onChange(
                items.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, note: event.target.value }
                    : entry,
                ),
              )
            }
          />
        </label>
        {item.sources.length > 0 && (
          <details className="shopping-sources">
            <summary>
              Per{" "}
              {new Set(item.sources.map((source) => source.id)).size === 1
                ? "una ricetta"
                : `${new Set(item.sources.map((source) => source.id)).size} ricette`}
            </summary>
            <ul>
              {item.sources.map((source, index) => (
                <li key={`${source.id}-${index}`}>
                  <strong>{source.title}</strong>
                  <span>{source.measure || "Quantità non indicata"}</span>
                </li>
              ))}
            </ul>
            <p>
              Quantità originali delle ricette: verifica quanto acquistare e le
              porzioni. Non sono sommate.
            </p>
          </details>
        )}
        {item.checked && (
          <Button secondary onClick={() => onStock(item)}>
            Porta in dispensa
          </Button>
        )}
        {removeId === item.id ? (
          <div className="shopping-removal">
            <p>Rimuovere {item.name} dalla lista?</p>
            <div>
              <button
                className="text-button"
                onClick={() => {
                  onChange(items.filter((entry) => entry.id !== item.id));
                  setRemoveId(null);
                  nameInput.current?.focus();
                  setAnnouncement(
                    `${item.name} rimosso dalla lista. Scorte invariate.`,
                  );
                }}
              >
                Conferma rimozione dalla lista
              </button>
              <button className="text-button" onClick={() => setRemoveId(null)}>
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <button
            className="text-button shopping-remove"
            aria-label={`Rimuovi ${item.name} dalla lista`}
            onClick={() => setRemoveId(item.id)}
          >
            Rimuovi dalla lista
          </button>
        )}
      </li>
    );
  }

  return (
    <section className="shopping-section" aria-labelledby="shopping-title">
      <div className="shopping-intro">
        <h2 id="shopping-title">La prossima spesa.</h2>
        <p>
          Segna ciò che compri, poi conferma quantità e posizione per portarlo
          in dispensa.
        </p>
        <div className="shopping-count">
          <strong>{remaining.length}</strong> da comprare
          <span>{purchased.length} acquistati</span>
        </div>
        {items.length > 0 && onStockAll && (
          <Button onClick={onStockAll}>
            {purchased.length
              ? `Porta in dispensa gli acquistati (${purchased.length})`
              : "Porta tutta la lista in dispensa"}
          </Button>
        )}
      </div>
      <form className="food-form shopping-add" onSubmit={addItem}>
        <label>
          Alimento da comprare
          <input
            ref={nameInput}
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Per esempio, ceci"
          />
        </label>
        <label>
          Nota facoltativa
          <input
            value={note}
            maxLength={160}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Per esempio, 2 confezioni"
          />
        </label>
        <Button type="submit" disabled={!name.trim()}>
          Aggiungi alla lista
        </Button>
      </form>
      <p className="shopping-feedback" role="status">
        {announcement}
      </p>
      {items.length === 0 ? (
        <div className="shopping-empty">
          <FoodImage file="generic-food.svg" size={64} />
          <h3>Un posto per quello che manca.</h3>
          <p>
            Scrivi un alimento oppure scegli cosa aggiungere dagli ingredienti
            di una ricetta.
          </p>
          <Button secondary onClick={onExplore}>
            Cerca una ricetta
          </Button>
        </div>
      ) : (
        <>
          <div className="shopping-group">
            <h3>Da comprare</h3>
            {remaining.length ? (
              <ul className="shopping-items">{remaining.map(row)}</ul>
            ) : (
              <p className="footnote">Hai spuntato tutti gli acquisti.</p>
            )}
          </div>
          {purchased.length > 0 && (
            <div className="shopping-group">
              <h3>Acquistati</h3>
              <p className="footnote">
                La spunta non modifica le scorte. Usa “Porta in dispensa” per
                registrare quanto hai comprato.
              </p>
              <ul className="shopping-items">{purchased.map(row)}</ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
