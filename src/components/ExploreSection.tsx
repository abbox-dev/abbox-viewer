import { useId, useMemo, useState } from "react";
import { actionsForRoute } from "../ir/actionsView";
import {
  canAppendTrailStep,
  currentRouteFromTrail,
  EXPLORE_MAX_TRAIL_ROUTES,
  type ExploreTrailStep,
  trailRoutes,
  transitionKindLabel,
  transitionsFromScreen,
  validScreensInOrder,
} from "../ir/exploreView";
import type {
  ActionsField,
  GlobalNavigationField,
  NavigationField,
  ScreenItem,
} from "../ir/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { ScreenActions } from "./ScreenActions";

type ExploreSectionProps = {
  actions: ActionsField;
  globalNavigation: GlobalNavigationField;
  items: ScreenItem[];
  navigation: NavigationField;
};

export function ExploreSection({
  actions,
  globalNavigation,
  items,
  navigation,
}: ExploreSectionProps) {
  const screens = useMemo(() => validScreensInOrder(items), [items]);
  const selectId = useId();
  const trailHeadingId = useId();
  const transitionsHeadingId = useId();

  const [startRoute, setStartRoute] = useState<string | null>(null);
  const [steps, setSteps] = useState<ExploreTrailStep[]>([]);

  const currentRoute =
    startRoute === null ? null : currentRouteFromTrail(startRoute, steps);

  const availableTransitions = useMemo(() => {
    if (currentRoute === null) {
      return [];
    }
    return transitionsFromScreen(currentRoute, navigation, globalNavigation);
  }, [currentRoute, navigation, globalNavigation]);

  const atTrailLimit =
    startRoute !== null && !canAppendTrailStep(startRoute, steps);

  const currentActions =
    currentRoute === null ? [] : actionsForRoute(actions, currentRoute);

  function handleStartChange(next: string) {
    if (next === "") {
      setStartRoute(null);
      setSteps([]);
      return;
    }
    setStartRoute(next);
    setSteps([]);
  }

  function handleTransition(step: ExploreTrailStep) {
    if (startRoute === null || !canAppendTrailStep(startRoute, steps)) {
      return;
    }
    setSteps((prev) => [...prev, step]);
  }

  function handleBack() {
    setSteps((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }

  function handleClear() {
    setStartRoute(null);
    setSteps([]);
  }

  const routes = startRoute === null ? [] : trailRoutes(startRoute, steps);

  return (
    <CollapsibleSection
      className="explore"
      headingId="explore-heading"
      id="explore"
      title="Explore"
    >
      <p className="lede explore-lede">
        Step through declared connections and main navigation from a chosen
        screen. This does not infer user flows or goals.
      </p>

      <div className="explore-start">
        <label className="explore-start-label" htmlFor={selectId}>
          Start screen
        </label>
        <select
          className="explore-start-select"
          id={selectId}
          onChange={(event) => {
            handleStartChange(event.target.value);
          }}
          value={startRoute ?? ""}
        >
          <option value="">Choose a screen</option>
          {screens.map((screen) => (
            <option key={screen.route} value={screen.route}>
              {screen.route}
            </option>
          ))}
        </select>
      </div>

      {startRoute !== null ? (
        <>
          <section aria-labelledby={trailHeadingId} className="explore-trail">
            <h4 className="explore-subheading" id={trailHeadingId}>
              Trail
            </h4>
            <ol className="explore-trail-list">
              <li className="explore-trail-start">
                <span className="route">{routes[0]}</span>
              </li>
              {steps.map((step, index) => (
                <li
                  className="explore-trail-step"
                  key={`trail-${String(index)}-${step.kind}-${step.to}`}
                >
                  <span className="explore-trail-arrow">→</span>
                  <span className="explore-trail-kind">
                    {transitionKindLabel(step.kind)}
                  </span>
                  <span className="explore-trail-arrow">→</span>
                  <span className="route">{step.to}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="explore-controls">
            <button
              className="explore-control-button"
              disabled={steps.length === 0}
              onClick={handleBack}
              type="button"
            >
              Back
            </button>
            <button
              className="explore-control-button"
              onClick={handleClear}
              type="button"
            >
              Clear
            </button>
          </div>

          <section
            aria-labelledby={transitionsHeadingId}
            className="explore-transitions"
          >
            <h4 className="explore-subheading" id={transitionsHeadingId}>
              Available next transitions
            </h4>
            {atTrailLimit ? (
              <p className="explore-limit product-meta">
                Trail limit reached ({String(EXPLORE_MAX_TRAIL_ROUTES)}{" "}
                screens).
              </p>
            ) : null}
            {availableTransitions.length === 0 ? (
              <p className="explore-empty product-meta">
                No transitions from this screen.
              </p>
            ) : (
              <ul className="explore-transition-list">
                {availableTransitions.map((transition, index) => (
                  <li
                    key={`transition-${String(index)}-${transition.kind}-${transition.to}`}
                  >
                    <button
                      aria-label={`${transitionKindLabel(transition.kind)} → ${transition.to}`}
                      className="explore-transition-button"
                      disabled={atTrailLimit}
                      onClick={() => {
                        handleTransition({
                          kind: transition.kind,
                          to: transition.to,
                        });
                      }}
                      type="button"
                    >
                      <span className="explore-trail-kind">
                        {transitionKindLabel(transition.kind)}
                      </span>
                      <span className="explore-trail-arrow">→</span>
                      <span className="route">{transition.to}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ScreenActions
            actions={currentActions}
            sectionId="explore-screen-actions"
          />
        </>
      ) : null}
    </CollapsibleSection>
  );
}
