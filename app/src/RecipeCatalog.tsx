import { useState } from "react";
import { Modal } from "./components";
import {
  catalogMeals,
  catalogSearch,
  recognizedFoods,
  type CatalogMeal,
} from "./catalog";
import type { Food } from "./domain";
import { Button } from "./components";
export default function RecipeCatalog({
  onClose,
  onSelect,
  foods,
  initialId = null,
}: {
  onClose: () => void;
  onSelect: (meal: CatalogMeal) => void;
  foods: Food[];
  initialId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(initialId);
  const meal = catalogMeals.find((m) => m.id === selected);
  return (
    <Modal title={meal ? meal.title : "Un primo ricettario"} onClose={onClose}>
      {meal ? (
        <>
          <button className="text-button" onClick={() => setSelected(null)}>
            Torna alle ricette
          </button>
          <p className="catalog-notice">
            Testo originale in inglese · Tempo e porzioni non disponibili. Le
            quantità non vengono adattate automaticamente.
          </p>
          <p className="catalog-notice">
            {recognizedFoods(meal, foods).length
              ? `Riconosco in dispensa: ${recognizedFoods(meal, foods).join(", ")}. Quantità e altri ingredienti sono da verificare.`
              : "Verifica ingredienti e quantità prima di scegliere."}
          </p>
          <Button onClick={() => onSelect(meal)}>
            Scegli per il prossimo pasto
          </Button>
          <h3>Ingredienti</h3>
          <ul>
            {meal.ingredients.map((i, index) => (
              <li key={index}>
                {i.name} {i.measure && `— ${i.measure}`}
              </li>
            ))}
          </ul>
          <h3 className="catalog-heading">Preparazione</h3>
          <p className="recipe-instructions">{meal.instructions}</p>
          <a
            className="catalog-source"
            href={
              /^https?:\/\//.test(meal.sourceUrl)
                ? meal.sourceUrl
                : "https://www.themealdb.com/"
            }
            target="_blank"
            rel="noreferrer"
          >
            Apri la fonte originale
          </a>
        </>
      ) : (
        <>
          <p className="catalog-notice">
            12 ricette da TheMealDB, importate per il prototipo didattico.
            Titoli e istruzioni sono in inglese. Puoi cercare anche ingredienti
            comuni in italiano; le ricette con ingredienti riconosciuti vengono
            prima. Fridgy continua a usare il suo ricettario dimostrativo.
          </p>
          <label className="catalog-search">
            Cerca per titolo o ingrediente
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Per esempio pasta, tomato…"
            />
          </label>
          <div className="catalog-list">
            {[...catalogMeals]
              .sort(
                (a, b) =>
                  recognizedFoods(b, foods).length -
                  recognizedFoods(a, foods).length,
              )
              .filter((m) => catalogSearch(m, query))
              .map((m) => (
                <button
                  className="recipe-option"
                  onClick={() => setSelected(m.id)}
                  key={m.id}
                >
                  <strong>{m.title}</strong>
                  <small>
                    {m.ingredients.length} ingredienti · Tempo non disponibile
                  </small>
                  <small>
                    {recognizedFoods(m, foods).length
                      ? `Riconosco in dispensa: ${recognizedFoods(m, foods).join(", ")}`
                      : "Ingredienti da verificare"}
                  </small>
                </button>
              ))}
          </div>
          {!catalogMeals.some((m) => catalogSearch(m, query)) && (
            <p>Nessuna ricetta trovata. Prova un altro ingrediente o titolo.</p>
          )}
          <a
            className="catalog-source"
            href="https://www.themealdb.com/api.php"
            target="_blank"
            rel="noreferrer"
          >
            Dati e condizioni: TheMealDB
          </a>
        </>
      )}
    </Modal>
  );
}
