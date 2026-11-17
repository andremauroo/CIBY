import { useState } from "react";
import { Button, FoodImage } from "./components";
import {
  artFor,
  available,
  dayLabel,
  isoDay,
  needs,
  recipes,
  upcomingMeals,
  weekBalance,
  type MealSlot,
  type State,
  type WeekMeal,
} from "./domain";

const slots: MealSlot[] = ["Pranzo", "Cena"];

/**
 * B03/B04: meals assigned to concrete occasions. Planning never changes the
 * stock; it shows what is covered, what is left without a use, what to buy.
 */
export default function WeekPlan({
  state,
  onAdd,
  onMove,
  onRemove,
  onCook,
  onBuy,
}: {
  state: State;
  onAdd: (date: string, slot: MealSlot) => void;
  onMove: (id: string, date: string, slot: MealSlot) => void;
  onRemove: (id: string) => void;
  onCook: (id: string) => void;
  onBuy: (items: { name: string; measure: string }[]) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => isoDay(i));
  const [day, setDay] = useState(days[0]);
  const [moving, setMoving] = useState<string | null>(null);
  const [cooking, setCooking] = useState<string | null>(null);
  const meals = upcomingMeals(state.week);
  const balance = weekBalance(state);
  const needed = balance.filter((b) => b.need > 0);
  const missing = needed.filter((b) => b.missing > 0);
  const free = balance
    .filter((b) => b.free > 0)
    .sort((a, b) => Number(b.soon) - Number(a.soon));
  const taken = (date: string, slot: MealSlot) =>
    meals.some((m) => m.date === date && m.slot === slot);

  function mealRow(meal: WeekMeal) {
    const recipe = recipes[meal.recipe];
    const lacking = Object.keys(needs(meal.recipe, meal.servings)).filter(
      (key) => missing.some((b) => b.key === key),
    );
    const ready = available(state.foods, meal.recipe, meal.servings);
    return (
      <div className="week-meal">
        <div className="week-meal-head">
          <div>
            <strong>{recipe.title}</strong>
            <small>
              {recipe.time} min · {recipe.effort} ·{" "}
              {meal.servings === 1 ? "1 persona" : "2 persone"}
            </small>
          </div>
        </div>
        <p className={`week-status ${lacking.length ? "lacking" : "covered"}`}>
          {lacking.length
            ? `Da comprare per i pasti previsti: ${missing
                .filter((b) => lacking.includes(b.key))
                .map((b) => b.label.toLowerCase())
                .join(", ")}`
            : "Ingredienti coperti dalle scorte"}
        </p>
        {moving === meal.id ? (
          <label className="week-move">
            Nuova occasione per {recipe.title}
            <select
              autoFocus
              defaultValue=""
              onChange={(e) => {
                const [date, slot] = e.target.value.split("|");
                if (!date) return;
                onMove(meal.id, date, slot as MealSlot);
                setMoving(null);
                setDay(date);
              }}
            >
              <option value="" disabled>
                Scegli giorno e pasto
              </option>
              {days.flatMap((date) =>
                slots
                  .filter((slot) => !taken(date, slot))
                  .map((slot) => (
                    <option key={date + slot} value={`${date}|${slot}`}>
                      {dayLabel(date)} · {slot.toLowerCase()}
                    </option>
                  )),
              )}
            </select>
            <button className="text-button" onClick={() => setMoving(null)}>
              Annulla
            </button>
          </label>
        ) : cooking === meal.id ? (
          <div className="week-confirm">
            <p>
              Verranno sottratte dalle scorte le quantità previste per{" "}
              {meal.servings === 1 ? "una porzione" : "due porzioni"}.
            </p>
            <Button
              onClick={() => {
                onCook(meal.id);
                setCooking(null);
              }}
            >
              Conferma: ho cucinato
            </Button>
            <button className="text-button" onClick={() => setCooking(null)}>
              Annulla
            </button>
          </div>
        ) : (
          <div className="week-actions">
            <button onClick={() => setMoving(meal.id)}>Sposta</button>
            <button disabled={!ready} onClick={() => setCooking(meal.id)}>
              Ho cucinato
            </button>
            <button
              onClick={() => onRemove(meal.id)}
              aria-label={`Togli ${recipe.title} dal piano`}
            >
              Togli
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="week" aria-labelledby="week-title">
      <h2 id="week-title" className="sr-only">
        I pasti dei prossimi sette giorni
      </h2>
      <div className="week-days" role="group" aria-label="Giorno">
        {days.map((date, index) => {
          const count = meals.filter((m) => m.date === date).length;
          const [, , d] = date.split("-");
          const weekday = new Date(
            Number(date.slice(0, 4)),
            Number(date.slice(5, 7)) - 1,
            Number(d),
          ).toLocaleDateString("it-IT", { weekday: "short" });
          return (
            <button
              key={date}
              aria-pressed={day === date}
              aria-label={`${dayLabel(date)}, ${count === 1 ? "1 pasto" : `${count} pasti`}`}
              onClick={() => {
                setDay(date);
                setMoving(null);
                setCooking(null);
              }}
            >
              <small>{index === 0 ? "oggi" : weekday.replace(".", "")}</small>
              <strong>{Number(d)}</strong>
              <span className="week-dots" aria-hidden="true">
                {Array.from({ length: count }, (_, n) => (
                  <i key={n} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="week-day">
        <h3>{dayLabel(day)}</h3>
        {slots.map((slot) => {
          const meal = meals.find((m) => m.date === day && m.slot === slot);
          return (
            <div className="week-slot" key={slot}>
              <span className="week-slot-name">{slot}</span>
              {meal ? (
                mealRow(meal)
              ) : (
                <button
                  className="week-add"
                  onClick={() => onAdd(day, slot)}
                  aria-label={`Aggiungi ${slot.toLowerCase()} di ${dayLabel(day).toLowerCase()}`}
                >
                  <span aria-hidden="true">+</span> Scegli una preparazione
                </button>
              )}
            </div>
          );
        })}
      </div>
      <section className="card week-needs" aria-labelledby="week-needs-title">
        <h3 id="week-needs-title">Cosa serve per i pasti previsti</h3>
        {needed.length ? (
          <>
            <ul className="week-balance">
              {needed.map((b) => (
                <li key={b.key} className={b.missing ? "missing" : "ok"}>
                  <span aria-hidden="true">{b.missing ? "!" : "✓"}</span>
                  <div>
                    <strong>{b.label}</strong>
                    <small>
                      {b.need} {b.unit} previsti · ne hai {b.have}
                      {b.missing ? ` · mancano ${b.missing}` : ""}
                    </small>
                    <small>Per {b.meals.join(", ")}</small>
                  </div>
                </li>
              ))}
            </ul>
            {missing.length > 0 ? (
              <Button
                secondary
                onClick={() =>
                  onBuy(
                    missing.map((b) => ({
                      name: b.label,
                      measure: `${b.missing} ${b.unit}`,
                    })),
                  )
                }
              >
                Aggiungi i mancanti alla spesa ({missing.length})
              </Button>
            ) : (
              <p className="green small">
                Nessun acquisto necessario per i pasti previsti (olio e sale da
                verificare).
              </p>
            )}
          </>
        ) : (
          <p className="footnote">
            Nessun pasto in programma. Scegli una preparazione per un giorno:
            vedrai qui cosa è coperto dalle scorte e cosa manca.
          </p>
        )}
      </section>
      {free.length > 0 && (
        <section className="week-free" aria-labelledby="week-free-title">
          <div className="section-heading">
            <h3 id="week-free-title">Ancora senza un pasto</h3>
            <small>Scorte non assegnate</small>
          </div>
          <ul>
            {free.map((b) => (
              <li key={b.key}>
                <FoodImage file={artFor(b.label)} size={32} />
                <span>
                  <strong>{b.label}</strong>
                  <small>
                    {b.free} {b.unit} {b.need ? "in più" : "da destinare"}
                  </small>
                </span>
                {b.soon && (
                  <span className="expiry-chip soon">Da usare presto</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="footnote">
        Pianificare non modifica le scorte: cambiano solo quando confermi di
        aver cucinato. Sono considerati gli alimenti che il ricettario
        dimostrativo riconosce.
      </p>
    </section>
  );
}
