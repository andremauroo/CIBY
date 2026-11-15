import { useState } from "react";
import { Modal, Button } from "./components";
import {
  catalogMeals,
  catalogSearch,
  recognizedFoods,
  ingredientMatches,
  type CatalogMeal,
} from "./catalog";
import type { Food } from "./domain";
import "./catalog.css";
export default function RecipeCatalog({
  onClose,
  onSelect,
  foods,
  initialId = null,
  initialQuery = "",
  favoriteIds,
  onToggleFavorite,
  onAddIngredients,
  onOpenShopping,
}: {
  onClose: () => void;
  onSelect: (meal: CatalogMeal) => void;
  foods: Food[];
  initialId?: string | null;
  initialQuery?: string;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onOpenShopping: () => void;
  onAddIngredients: (
    ingredients: { name: string; measure: string }[],
    meal: CatalogMeal,
  ) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState("Tutte");
  const [selected, setSelected] = useState<string | null>(initialId);
  const [selection, setSelection] = useState<number[] | null>(null);
  const [feedback, setFeedback] = useState("");
  const meal = catalogMeals.find((m) => m.id === selected);
  const ingredients = meal ? ingredientMatches(meal, foods) : [];
  const checked =
    selection ??
    ingredients.flatMap((i, index) => (i.recognized ? [] : [index]));
  const visible = [...catalogMeals]
    .filter(
      (m) =>
        catalogSearch(m, query) &&
        (filter !== "Preferite" || favoriteIds.includes(m.id)) &&
        (filter !== "Dalla dispensa" || recognizedFoods(m, foods).length > 0),
    )
    .sort(
      (a, b) =>
        recognizedFoods(b, foods).length - recognizedFoods(a, foods).length,
    );
  function openMeal(id: string | null) {
    setSelected(id);
    setSelection(null);
    setFeedback("");
  }
  return (
    <Modal title={meal ? meal.title : "Un primo ricettario"} onClose={onClose}>
      {meal ? (
        <>
          <div className="catalog-detail-actions">
            <button className="text-button" onClick={() => openMeal(null)}>
              Torna alle ricette
            </button>
            <button
              className="favorite-button"
              aria-pressed={favoriteIds.includes(meal.id)}
              onClick={() => onToggleFavorite(meal.id)}
            >
              <span aria-hidden="true">
                {favoriteIds.includes(meal.id) ? "♥" : "♡"}
              </span>
              {favoriteIds.includes(meal.id) ? "Salvata" : "Salva ricetta"}
            </button>
          </div>
          <p className="catalog-notice">
            Sintesi CIBY in italiano · Dosi della fonte per {meal.servingsLabel}
            {" persone"}. Le quantità
            non vengono adattate automaticamente.{" "}
            {meal.minutes === null
              ? "Tempo non disponibile."
              : `Preparazione e cottura: circa ${meal.minutes} min.`}{" "}
            {meal.timingNote}
          </p>
          <Button onClick={() => onSelect(meal)}>
            Scegli per il prossimo pasto
          </Button>
          <section
            className="ingredient-review"
            aria-labelledby="ingredients-title"
          >
            <h3 id="ingredients-title">Ingredienti e dispensa</h3>
            <p className="footnote">
              Confronto i nomi, non le quantità. Controlla dosi e varianti anche
              per gli alimenti riconosciuti.
            </p>
            <p className="ingredient-selection-hint">
              Seleziona cosa mettere nella lista della spesa.
            </p>
            <ul className="ingredient-checklist">
              {ingredients.map((i, index) => (
                <li key={index}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked.includes(index)}
                      onChange={() => {
                        setSelection(
                          checked.includes(index)
                            ? checked.filter((n) => n !== index)
                            : [...checked, index],
                        );
                        setFeedback("");
                      }}
                    />
                    <span>
                      <strong>{i.label}</strong>
                      <small>
                        {i.measure || "Quantità non indicata"}
                        {i.label.toLowerCase() !== i.name.toLowerCase()
                          ? ` · ${i.name}`
                          : ""}
                      </small>
                      <span
                        className={`ingredient-stock ${i.recognized ? "recognized" : "unrecognized"}`}
                      >
                        {i.recognized
                          ? `Riconosciuto: ${i.foods.map((f) => `${f.name} ${f.quantity} ${f.unit}`).join(", ")}`
                          : "Non riconosciuto in dispensa"}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <Button
              secondary
              disabled={!checked.length}
              onClick={() => {
                onAddIngredients(
                  ingredients
                    .filter((_, index) => checked.includes(index))
                    .map((i) => ({ name: i.label, measure: i.measure })),
                  meal,
                );
                setSelection([]);
                setFeedback(
                  "Lista della spesa aggiornata. La trovi in Dispensa; le scorte non sono cambiate.",
                );
              }}
            >
              Aggiungi alla spesa{checked.length ? ` (${checked.length})` : ""}
            </Button>
            <p className="catalog-feedback" role="status">
              {feedback}
            </p>
            <button className="text-button" onClick={onOpenShopping}>
              Apri lista della spesa
            </button>
          </section>
          <h3 className="catalog-heading">Preparazione</h3>
          <p className="recipe-instructions">{meal.instructions}</p>
          <a
            className="catalog-source"
            href={/^https?:\/\//.test(meal.sourceUrl) ? meal.sourceUrl : "#"}
            target="_blank"
            rel="noreferrer"
          >
            Preparazione completa su {meal.sourceName}
          </a>
        </>
      ) : (
        <>
          <p className="catalog-notice">
            {catalogMeals.length} ricette di cucina italiana selezionate da
            GialloZafferano, Cucchiaio d’Argento e La Cucina Italiana. Salva le
            preferite e controlla cosa hai già. Ogni scheda include una sintesi
            CIBY e il link alla fonte.
          </p>
          <div className="filters catalog-filters" aria-label="Filtra ricette">
            {["Tutte", "Dalla dispensa", "Preferite"].map((value) => (
              <button
                key={value}
                aria-pressed={filter === value}
                className={filter === value ? "selected" : ""}
                onClick={() => setFilter(value)}
              >
                {value}
                {value === "Preferite" ? ` (${favoriteIds.length})` : ""}
              </button>
            ))}
          </div>
          <label className="catalog-search">
            Cerca per titolo o ingrediente
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Per esempio pasta, tomato…"
            />
          </label>
          <p className="catalog-results" role="status">
            {visible.length} ricette
            {filter === "Dalla dispensa"
              ? " con almeno un ingrediente riconosciuto"
              : ""}
          </p>
          <div className="catalog-list">
            {visible.map((m) => {
              const recognized = recognizedFoods(m, foods);
              return (
                <button
                  className="recipe-option"
                  onClick={() => openMeal(m.id)}
                  key={m.id}
                >
                  <strong>{m.title}</strong>
                  {favoriteIds.includes(m.id) && (
                    <span className="catalog-saved">
                      Salvata tra le preferite
                    </span>
                  )}
                  <small>
                    {m.ingredients.length} ingredienti ·{" "}
                    {m.minutes === null
                      ? "Tempo non disponibile"
                      : `circa ${m.minutes} min`}
                  </small>
                  <small>
                    {m.region} · {m.sourceName}
                  </small>
                  <small>
                    {recognized.length
                      ? `Riconosco in dispensa: ${recognized.join(", ")}`
                      : "Ingredienti da verificare"}
                  </small>
                </button>
              );
            })}
          </div>
          {!visible.length && (
            <div className="catalog-empty">
              <h3>
                {filter === "Preferite" && !favoriteIds.length
                  ? "Le tue ricette, a portata di mano."
                  : "Nessuna ricetta trovata."}
              </h3>
              <p>
                {filter === "Preferite" && !favoriteIds.length
                  ? "Apri una ricetta e tocca Salva ricetta per ritrovarla qui."
                  : "Prova un altro ingrediente o cambia filtro. Il ricettario contiene ancora poche ricette."}
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setFilter("Tutte");
                  setQuery("");
                }}
              >
                Mostra tutte le ricette
              </button>
            </div>
          )}
          <p className="footnote">
            Le sintesi sono scritte per CIBY. Le fonti riportano le preparazioni
            complete; tempi e dosi si riferiscono alla versione indicata, senza
            conversioni automatiche.
          </p>
        </>
      )}
    </Modal>
  );
}
