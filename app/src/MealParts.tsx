import {
  formatAmount,
  mealInfo,
  mealNeeds,
  stockOf,
  type Food,
  type RecipeRef,
} from "./domain";

/**
 * Ingredients of a planned meal: verified quantities (computed, compared with
 * the stock) and quantities that the person still has to confirm.
 */
export function MealNeedsList({
  recipe,
  servings,
  foods,
}: {
  recipe: RecipeRef;
  servings: number;
  foods: Food[];
}) {
  const lines = mealNeeds(recipe, servings);
  const verified = lines.filter((l) => l.verified);
  const open = lines.filter((l) => !l.verified);
  return (
    <div className="meal-needs">
      {verified.length > 0 && (
        <ul className="compare-ingredients">
          {verified.map((l, i) => {
            const have = stockOf(foods, l.key!);
            const ok = have >= l.amount!;
            return (
              <li key={i} className={ok ? "ok" : "missing"}>
                <span aria-hidden="true">{ok ? "✓" : "!"}</span>
                {l.name}: {formatAmount(l.amount!, l.unit!)}
                <small>
                  {ok
                    ? ` · ne hai ${formatAmount(have, l.unit!)}`
                    : ` · ne mancano ${formatAmount(l.amount! - have, l.unit!)}`}
                </small>
              </li>
            );
          })}
        </ul>
      )}
      {open.length > 0 && (
        <details className="meal-confirm">
          <summary>
            {open.length === 1
              ? "1 quantità da confermare"
              : `${open.length} quantità da confermare`}
          </summary>
          <ul>
            {open.map((l, i) => (
              <li key={i}>
                <strong>{l.name}</strong> · {l.measure}
                <small> · {l.reason}</small>
              </li>
            ))}
          </ul>
          <p className="footnote">
            Queste quantità non vengono sottratte dalle scorte: controllale tu
            e, se serve, aggiorna la dispensa.
          </p>
        </details>
      )}
    </div>
  );
}

/** Text of the "ho cucinato" confirmation: what changes and what does not. */
export function CookSummary({
  recipe,
  servings,
}: {
  recipe: RecipeRef;
  servings: number;
}) {
  const lines = mealNeeds(recipe, servings);
  const verified = lines.filter((l) => l.verified);
  const open = lines.filter((l) => !l.verified && l.key);
  return (
    <div className="cook-summary">
      <p>
        {mealInfo(recipe).title},{" "}
        {servings === 1 ? "1 porzione" : `${servings} porzioni`}.{" "}
        {verified.length
          ? "Verranno sottratte dalle scorte:"
          : "Nessuna quantità verificata da sottrarre."}
      </p>
      {verified.length > 0 && (
        <ul>
          {verified.map((l, i) => (
            <li key={i}>
              {l.name}: {formatAmount(l.amount!, l.unit!)}
            </li>
          ))}
        </ul>
      )}
      {open.length > 0 && (
        <p className="footnote">
          Non sottratte, da aggiornare a mano se le hai usate:{" "}
          {open.map((l) => l.name).join(", ")}.
        </p>
      )}
    </div>
  );
}
