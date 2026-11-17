import { useState } from "react";
import { Button, FoodImage, Modal } from "./components";
import { artFor, purchaseDefaults, type Food } from "./domain";
import type { ShoppingItem } from "./shopping";

type Row = {
  include: boolean;
  quantity: string;
  unit: Food["unit"];
  place: Food["place"];
  expires: string;
};
const units: Food["unit"][] = ["pezzi", "g", "kg", "ml", "l", "confezioni"];

/**
 * B04 → B01: after shopping, register several purchases at once. Each row
 * still needs the real quantity; recipe measures are shown only as references.
 */
export default function StockAll({
  items,
  onConfirm,
  onClose,
}: {
  items: ShoppingItem[];
  onConfirm: (
    rows: {
      itemId: string;
      name: string;
      quantity: number;
      unit: Food["unit"];
      place: Food["place"];
      expires?: string;
    }[],
  ) => void;
  onClose: () => void;
}) {
  const anyChecked = items.some((item) => item.checked);
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      items.map((item) => [
        item.id,
        {
          include: anyChecked ? item.checked : true,
          quantity: "",
          expires: "",
          ...purchaseDefaults(item.name),
        },
      ]),
    ),
  );
  const update = (id: string, patch: Partial<Row>) =>
    setRows((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  const included = items.filter((item) => rows[item.id].include);
  const missing = included.filter(
    (item) => !(Number(rows[item.id].quantity) > 0),
  );

  return (
    <Modal title="Porta in dispensa" onClose={onClose}>
      <p className="compare-intro">
        Indica quanto hai comprato davvero e dove lo conservi. Le quantità delle
        ricette sono solo un riferimento. Le voci confermate escono dalla lista;
        le scorte già presenti non cambiano.
      </p>
      <form
        className="stock-all"
        onSubmit={(e) => {
          e.preventDefault();
          if (!included.length || missing.length) return;
          onConfirm(
            included.map((item) => ({
              itemId: item.id,
              name: item.name,
              quantity: Number(rows[item.id].quantity),
              unit: rows[item.id].unit,
              place: rows[item.id].place,
              expires: rows[item.id].expires || undefined,
            })),
          );
        }}
      >
        <ul>
          {items.map((item) => {
            const row = rows[item.id];
            const reference = item.sources
              .map((s) => s.measure)
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={item.id}
                className={`stock-row ${row.include ? "" : "excluded"}`}
              >
                <label className="stock-row-head">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) =>
                      update(item.id, { include: e.target.checked })
                    }
                  />
                  <FoodImage file={artFor(item.name)} size={32} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.checked ? "Acquistato" : "Ancora da comprare"}
                      {reference ? ` · ricetta: ${reference}` : ""}
                      {item.note ? ` · ${item.note}` : ""}
                    </small>
                  </span>
                </label>
                {row.include && (
                  <div className="stock-row-fields">
                    <label>
                      Quantità
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.1"
                        step="0.1"
                        required
                        aria-label={`Quantità di ${item.name}`}
                        value={row.quantity}
                        onChange={(e) =>
                          update(item.id, { quantity: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Unità
                      <select
                        aria-label={`Unità di ${item.name}`}
                        value={row.unit}
                        onChange={(e) =>
                          update(item.id, {
                            unit: e.target.value as Food["unit"],
                          })
                        }
                      >
                        {units.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Dove
                      <select
                        aria-label={`Posizione di ${item.name}`}
                        value={row.place}
                        onChange={(e) =>
                          update(item.id, {
                            place: e.target.value as Food["place"],
                          })
                        }
                      >
                        <option>Frigo</option>
                        <option>Dispensa</option>
                      </select>
                    </label>
                    <label className="stock-row-date">
                      Da consumare entro (facoltativo)
                      <input
                        type="date"
                        aria-label={`Data per ${item.name}`}
                        value={row.expires}
                        onChange={(e) =>
                          update(item.id, { expires: e.target.value })
                        }
                      />
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="footnote" role="status">
          {!included.length
            ? "Seleziona almeno un alimento."
            : missing.length
              ? `Manca la quantità per: ${missing.map((i) => i.name).join(", ")}.`
              : `${included.length === 1 ? "1 alimento pronto" : `${included.length} alimenti pronti`} per la dispensa.`}
        </p>
        <Button type="submit" disabled={!included.length || missing.length > 0}>
          {included.length === 1
            ? "Salva 1 alimento in dispensa"
            : `Salva ${included.length} alimenti in dispensa`}
        </Button>
      </form>
    </Modal>
  );
}
