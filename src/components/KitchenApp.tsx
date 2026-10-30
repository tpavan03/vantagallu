import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { localize } from "../domain/types";
import type {
  CookingCommand,
  CookingSetup,
  CookingSession,
  CookingTimer,
  Language,
  Recipe,
  RecipeIngredient,
  SaveStatus,
  VoiceStatus,
} from "../domain/types";
import KitchenTextarea from "./KitchenTextarea";
import Cooker, { CookerIcon } from "./Cooker";
import { sessionIngredients, ingredientAmount } from "../domain/session";
import { spiceMeasure, formatKitchenQuantity as quantity } from "../domain/measures";
import { heatGuidance, setupAdaptationRequest } from "../domain/setup";
import { CookingPan, IngredientDrawing } from "./CookingPan";
import "../styles/kitchen.css";

type ActionResult = void | Promise<void>;
export interface KitchenAppProps {
  recipes: Recipe[];
  session: CookingSession | null;
  sessions: CookingSession[];
  user: { email: string } | null;
  online: boolean;
  saveStatus: SaveStatus;
  voiceStatus: VoiceStatus;
  voiceError?: string | null;
  liveTranscript?: string;
  streamingReply?: string;
  chatPending: boolean;
  error?: string | null;
  language?: Language;
  authPending?: boolean;
  authMessage?: string | null;
  voiceAvailable?: boolean;
  chatAvailable?: boolean;
  authAvailable?: boolean;
  onStartRecipe: (recipeId: string, setup?: CookingSetup) => ActionResult;
  onResumeSession: (sessionId: string) => ActionResult;
  onLanguageChange: (language: Language) => ActionResult;
  onSendMessage: (text: string) => ActionResult;
  onConfirmIngredient: (ingredient: RecipeIngredient) => ActionResult;
  onAdvance: () => ActionResult;
  onSetServings: (servings: number) => ActionResult;
  onSetCookware: (cookware: string) => ActionResult;
  onTimerAction: (
    action: "start" | "pause" | "resume" | "cancel",
    timer?: CookingTimer,
  ) => ActionResult;
  onVoiceToggle: () => ActionResult;
  onSignIn: (email?: string) => ActionResult;
  onSignOut: () => ActionResult;
  onDismissError?: () => void;
  onCommand?: (command: CookingCommand) => ActionResult;
}

const languageLabels: Record<Language, string> = {
  en: "English",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
};
const regions: Record<string, string> = {
  andhra: "Andhra",
  telangana: "Telangana",
  rayalaseema: "Rayalaseema",
  tamil: "Tamil Nadu",
  karnataka: "Karnataka",
  kerala: "Kerala",
  "south-indian": "South Indian",
};
const dietLabels: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  egg: "Egg",
  "non-vegetarian": "Non-vegetarian",
};

function recipeTime(recipe: Recipe) {
  if (recipe.prepMinutes >= 90)
    return `${recipe.cookMinutes} min cooking · prep ahead`;
  const total = recipe.prepMinutes + recipe.cookMinutes;
  if (total < 60) return `${total} min`;
  return `${Math.floor(total / 60)} hr${total % 60 ? ` ${total % 60} min` : ""}`;
}

function recipeMethodLabel(recipe: Recipe) {
  const publisher =
    recipe.sources[0]?.author || recipe.sources[0]?.name || "Home-style method";
  const method = recipe.authorMethod.split("—")[1]?.split(";")[0]?.trim();
  return method && !method.startsWith("source-adapted")
    ? `${publisher} · ${method}`
    : `${publisher} · ${recipe.equipment[0] || "Home kitchen"}`;
}
const voiceLabels: Record<VoiceStatus, string> = {
  idle: "Talk to me",
  connecting: "Connecting…",
  listening: "Listening",
  speaking: "Speaking",
  reconnecting: "Reconnecting…",
  error: "Retry voice",
};
const duration = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;

function Icon({
  name,
  ...props
}: {
  name: "voice" | "chat" | "clock" | "light" | "close" | "account";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {name === "voice" ? (
        <>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
        </>
      ) : name === "chat" ? (
        <path d="M4 4h16v12H9l-5 4ZM8 8h8m-8 4h5" />
      ) : name === "clock" ? (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M9 2h6m-3 7v4l3 2" />
        </>
      ) : name === "light" ? (
        <path d="M12 2a7 7 0 0 0-4 13v4h8v-4a7 7 0 0 0-4-13ZM9 16h6m-5 6h4" />
      ) : name === "account" ? (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
        </>
      ) : (
        <path d="m6 6 12 12M6 18 18 6" />
      )}
    </svg>
  );
}

function RecipeLibrary({
  recipes,
  language,
  onSelect,
}: {
  recipes: Recipe[];
  language: Language;
  onSelect: (recipe: Recipe) => void;
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [diet, setDiet] = useState("all");
  const visible = recipes.filter(
    (recipe) =>
      (region === "all" || recipe.region === region) &&
      (diet === "all" ||
        (diet === "veg"
          ? ["vegetarian", "vegan"].includes(recipe.diet)
          : ["egg", "non-vegetarian"].includes(recipe.diet))) &&
      [
        recipe.title.en,
        ...Object.values(recipe.title),
        recipe.summary.en,
        recipe.region,
        ...recipe.categories,
        ...recipe.ingredients.map((i) => i.name.en),
        ...(recipe.aliases || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="recipe-library">
      <div className="library-filters">
        <label className="search-field">
          <span className="sr-only">Search recipes or ingredients</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="A dish, an ingredient, a craving…"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear recipe search"
            >
              ×
            </button>
          )}
        </label>
        <div className="library-selects">
          <label>
            <span className="sr-only">Filter by region</span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="all">All regions</option>
              {Object.entries(regions).map(([id, label]) => (
                <option value={id} key={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by diet</span>
            <select
              value={diet}
              onChange={(event) => setDiet(event.target.value)}
            >
              <option value="all">All dishes</option>
              <option value="veg">Vegetarian / vegan</option>
              <option value="nonveg">Egg / non-vegetarian</option>
            </select>
          </label>
        </div>
      </div>
      <p className="result-count" role="status">
        {visible.length} {visible.length === 1 ? "recipe" : "recipes"}
      </p>
      <div className="recipe-list">
        {visible.map((recipe) => (
          <button
            className="recipe-row"
            onClick={() => onSelect(recipe)}
            key={recipe.id}
          >
            <span className="recipe-drawing">
              <IngredientDrawing
                name={recipe.ingredients[0]?.name.en || recipe.categories[0]}
              />
            </span>
            <span>
              <strong>{localize(recipe.title, language)}</strong>
              <span className="recipe-row-details">
                {regions[recipe.region]} · {dietLabels[recipe.diet]} ·{" "}
                {recipeTime(recipe)}
              </span>
              <small>{recipeMethodLabel(recipe)}</small>
            </span>
            <span className="recipe-open" aria-hidden="true">
              ↗
            </span>
          </button>
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <h3>No recipe found, yet.</h3>
          <p>Try another ingredient, or widen the region and dish filters.</p>
          <button
            className="pill"
            onClick={() => {
              setQuery("");
              setRegion("all");
              setDiet("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function TimerControl({
  timer,
  now,
  onAction,
  busy,
}: {
  timer: CookingTimer;
  now: number;
  onAction: KitchenAppProps["onTimerAction"];
  busy: boolean;
}) {
  const remaining =
    timer.status === "running" && timer.endAt
      ? Math.max(0, Math.ceil((Date.parse(timer.endAt) - now) / 1000))
      : Math.max(0, Math.ceil(timer.remainingSeconds));
  return (
    <div className={`timer ${remaining === 0 ? "timer-ended" : ""}`}>
      <Icon name="clock" />
      <span>
        <span className="timer-name">{timer.label}</span>
        <strong>
          {remaining === 0
            ? "Time’s up · check your food"
            : duration(remaining)}
        </strong>
      </span>
      <button
        disabled={busy}
        onClick={() =>
          void onAction(
            remaining === 0
              ? "start"
              : timer.status === "running"
                ? "pause"
                : "resume",
            timer,
          )
        }
      >
        {remaining === 0
          ? "Restart"
          : timer.status === "running"
            ? "Pause"
            : "Resume"}
      </button>
      <button
        className="timer-cancel"
        disabled={busy}
        onClick={() => void onAction("cancel", timer)}
        aria-label={`Cancel ${timer.label} timer`}
      >
        <Icon name="close" />
      </button>
    </div>
  );
}

function defaultSetup(
  ingredients: RecipeIngredient[],
  saved?: CookingSetup,
  addedIds: string[] = [],
): CookingSetup {
  const missing = new Set(
    (saved?.unavailableIngredientIds || []).filter(
      (id) => !addedIds.includes(id),
    ),
  );
  return {
    heatSource: saved?.heatSource || "gas",
    inductionMaxWatts: saved?.inductionMaxWatts || 1800,
    ...(saved?.pantryNotes ? { pantryNotes: saved.pantryNotes } : {}),
    availableIngredientIds: ingredients
      .filter((item) => !missing.has(item.id))
      .map((item) => item.id),
    unavailableIngredientIds: ingredients
      .filter((item) => missing.has(item.id))
      .map((item) => item.id),
  };
}

function CookingSetupFields({
  ingredients,
  setup,
  onChange,
  language,
  disabled,
  addedIds = [],
  recipe,
  session,
}: {
  ingredients: RecipeIngredient[];
  setup: CookingSetup;
  onChange: (setup: CookingSetup) => void;
  language: Language;
  disabled: boolean;
  addedIds?: string[];
  recipe?: Recipe;
  session?: CookingSession;
}) {
  return (
    <div className="cooking-setup-fields">
      <fieldset className="stove-choice">
        <legend>What are you cooking on?</legend>
        <label>
          <input
            type="radio"
            name="heat-source"
            value="gas"
            checked={setup.heatSource === "gas"}
            disabled={disabled}
            onChange={() => onChange({ ...setup, heatSource: "gas" })}
          />
          <span>
            Gas stove<small>Low, medium and high flame</small>
          </span>
        </label>
        <label>
          <input
            type="radio"
            name="heat-source"
            value="induction"
            checked={setup.heatSource === "induction"}
            disabled={disabled}
            onChange={() => onChange({ ...setup, heatSource: "induction" })}
          />
          <span>
            Induction<small>Up to {setup.inductionMaxWatts} W</small>
          </span>
        </label>
      </fieldset>
      <p className="field-help">
        {setup.heatSource === "induction"
          ? "Watt settings are starting points. Use induction-compatible cookware, check the pan and adjust; the app does not control your stove."
          : "Follow the flame setting and cooking checkpoints. A timer alone cannot confirm doneness."}
      </p>
      <div className="pantry-heading">
        <h3>What’s in your kitchen?</h3>
        <span>{setup.unavailableIngredientIds.length} missing</span>
      </div>
      <p className="field-help">
        Tick what you have; cross what’s missing. This does not mark anything as
        added to the pan.
      </p>
      <div
        className="pantry-choices"
        role="region"
        aria-label="Ingredients you have"
        tabIndex={0}
      >
        {ingredients.map((ingredient) => {
          const missing = setup.unavailableIngredientIds.includes(
            ingredient.id,
          );
          const added = addedIds.includes(ingredient.id);
          const amount =
            session && recipe
              ? ingredientAmount(recipe, session, ingredient).target
              : ingredient.quantity;
          const measure = spiceMeasure(
            ingredient.name.en,
            amount,
            ingredient.unit,
          );
          return (
            <button
              key={ingredient.id}
              type="button"
              className={`pantry-choice ${missing ? "is-missing" : "is-available"}`}
              disabled={disabled || added}
              aria-pressed={!missing}
              onClick={() => {
                const unavailable = new Set(setup.unavailableIngredientIds);
                if (missing) unavailable.delete(ingredient.id);
                else unavailable.add(ingredient.id);
                onChange({
                  ...setup,
                  unavailableIngredientIds: ingredients
                    .filter((item) => unavailable.has(item.id))
                    .map((item) => item.id),
                  availableIngredientIds: ingredients
                    .filter((item) => !unavailable.has(item.id))
                    .map((item) => item.id),
                });
              }}
            >
              <span>
                <strong>{localize(ingredient.name, language)}</strong>
                <small>
                  {/to taste|as needed/i.test(measure.unit)
                    ? measure.unit
                    : `${quantity(measure.quantity)} ${measure.unit}`}
                  {ingredient.optional ? " · optional" : ""}
                </small>
              </span>
              <span className="pantry-status">
                {added ? "✓ Already added" : missing ? "× Missing" : "✓ Have"}
              </span>
            </button>
          );
        })}
      </div>
      <label className="field-label pantry-notes-label" htmlFor="pantry-notes">
        Other ingredients I have
      </label>
      <KitchenTextarea
        id="pantry-notes"
        value={setup.pantryNotes || ""}
        onChange={(event) =>
          onChange({ ...setup, pantryNotes: event.target.value })
        }
        disabled={disabled}
        rows={3}
        maxLength={2000}
        placeholder="Curd, cashews, store-bought chicken masala powder…"
      />
      <p className="field-help">
        Available in your kitchen, not already added. COOKer can consider these
        when finding a substitute.
      </p>
    </div>
  );
}

export default function KitchenApp(props: KitchenAppProps) {
  const {
    recipes,
    session,
    sessions,
    user,
    online,
    saveStatus,
    voiceStatus,
    voiceError,
    chatPending,
  } = props;
  const language = session?.language || props.language || "en";
  const recipe =
    session?.recipeSnapshot ||
    recipes.find((item) => item.id === session?.recipeId);
  const updatedRecipe = session
    ? recipes.find(
        (item) =>
          item.id === session.recipeId && item.version > session.recipeVersion,
      )
    : undefined;
  const ingredients =
    recipe && session ? sessionIngredients(recipe, session) : [];
  const stepIndex = session
    ? session.steps.findIndex((step) => step.id === session.currentStepId)
    : -1;
  const step = session?.steps[stepIndex];
  const heatGuide = step ? heatGuidance(step, session?.cookingSetup) : null;
  const finished = session?.status === "completed";
  const [modal, setModal] = useState<
    | "recipes"
    | "sessions"
    | "chat"
    | "voice"
    | "adapt"
    | "servings"
    | "cookware"
    | "account"
    | "recipe"
    | "setup"
    | null
  >(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeIntent, setRecipeIntent] = useState<"inspect" | "start">(
    "start",
  );
  const [chatLimit, setChatLimit] = useState(80);
  const [message, setMessage] = useState("");
  const [adaptation, setAdaptation] = useState("");
  const [email, setEmail] = useState("");
  const [servingDraft, setServingDraft] = useState("2");
  const [cookwareDraft, setCookwareDraft] = useState("");
  const [setupDraft, setSetupDraft] = useState<CookingSetup | null>(null);
  const [previewSetup, setPreviewSetup] = useState<CookingSetup | null>(null);
  const [previewSetupOpen, setPreviewSetupOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const chatInput = useRef<HTMLTextAreaElement>(null);
  const voiceActive = [
    "connecting",
    "listening",
    "speaking",
    "reconnecting",
  ].includes(voiceStatus);
  const visibleTimers =
    session?.timers.filter((timer) => timer.status !== "cancelled") || [];
  const busy = busyAction !== null;

  useEffect(() => {
    if (!session?.timers.some((timer) => timer.status === "running")) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session?.timers]);
  useEffect(() => {
    if (modal) {
      if (!dialog.current?.open) dialog.current?.showModal();
      if (modal === "chat") chatInput.current?.focus();
    } else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [session?.messages.length, chatPending, modal]);

  async function perform(name: string, action: () => ActionResult) {
    if (pending.current) return false;
    pending.current = true;
    setBusyAction(name);
    setActionError(null);
    try {
      await action();
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "That change could not be saved. Please try again.",
      );
      return false;
    } finally {
      pending.current = false;
      setBusyAction(null);
    }
  }
  async function toggleVoice() {
    if (!props.user) {
      setModal("account");
      return;
    }
    try {
      // Keep the actual start inside this click gesture for microphone permissions.
      if (!voiceActive) setModal("voice");
      await props.onVoiceToggle();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Voice could not connect. Please try again.",
      );
    }
  }
  function chooseRecipe(item: Recipe) {
    setPreviewSetup(null);
    setPreviewSetupOpen(false);
    setSelectedRecipe(item);
    setRecipeIntent("start");
    setModal("recipe");
  }
  function closeModal() {
    setModal(null);
  }
  function validateForm(event: FormEvent<HTMLFormElement>) {
    for (const field of event.currentTarget.querySelectorAll(
      '[aria-invalid="true"]',
    )) {
      field.removeAttribute("aria-invalid");
      const ids = (field.getAttribute("aria-describedby") || "")
        .split(" ")
        .filter((id) => id && id !== "kitchen-form-error");
      if (ids.length) field.setAttribute("aria-describedby", ids.join(" "));
      else field.removeAttribute("aria-describedby");
    }
    const invalid = event.currentTarget.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(":invalid");
    if (invalid) {
      event.preventDefault();
      event.stopPropagation();
      invalid.setAttribute("aria-invalid", "true");
      invalid.setAttribute(
        "aria-describedby",
        `${invalid.getAttribute("aria-describedby") || ""} kitchen-form-error`.trim(),
      );
      setActionError(
        invalid.validationMessage || "Check this field before continuing.",
      );
      invalid.focus();
    } else setActionError(null);
  }
  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!message.trim() || chatPending || !online) return;
    const sent = await perform("chat", () =>
      props.onSendMessage(message.trim()),
    );
    if (sent) setMessage("");
  }
  function openServings() {
    setServingDraft(String(session?.servings || 2));
    setModal("servings");
  }
  function openCookware() {
    setCookwareDraft(session?.cookware || recipe?.equipment[0] || "Pan");
    setModal("cookware");
  }
  function openSetup() {
    if (!session) return;
    setSetupDraft(
      defaultSetup(
        ingredients,
        session.cookingSetup,
        session.addedIngredients.map((item) => item.ingredientId),
      ),
    );
    setModal("setup");
  }
  const statusText =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "error"
        ? "Saving needs attention"
        : !online
          ? "Offline · saved on this device"
          : user && saveStatus === "saved"
            ? "Saved to your account"
            : "Saved on this device";
  const topError = actionError || props.error;

  let dialogTitle = "";
  let dialogDescription: ReactNode = null;
  let dialogContent: ReactNode = null;
  if (modal === "recipes") {
    dialogTitle = "What’s cooking?";
    dialogDescription = "Telugu favourites and a wider South Indian kitchen.";
    dialogContent = (
      <RecipeLibrary
        recipes={recipes}
        language={language}
        onSelect={chooseRecipe}
      />
    );
  }
  if (modal === "recipe" && selectedRecipe) {
    const adaptOnStart = Boolean(
      previewSetup &&
      user &&
      online &&
      props.chatAvailable !== false &&
      (previewSetup.unavailableIngredientIds.length ||
        previewSetup.heatSource === "induction" ||
        previewSetup.pantryNotes?.trim()),
    );
    dialogTitle = localize(selectedRecipe.title, language);
    dialogDescription = localize(selectedRecipe.summary, language);
    dialogContent = (
      <div className="recipe-preview">
        <div className="recipe-meta">
          <span>{regions[selectedRecipe.region]}</span>
          <span>{dietLabels[selectedRecipe.diet]}</span>
          <span>{recipeTime(selectedRecipe)}</span>
        </div>
        <h3>The method you’re starting with</h3>
        <p>{selectedRecipe.authorMethod}</p>
        <p className="review-note">
          {selectedRecipe.reviewStatus === "source-checked"
            ? "Source checked. Kitchen results can vary with ingredients and equipment."
            : "Kitchen testing pending. Read the method and checkpoints before starting."}
        </p>
        {recipeIntent === "start" && (
          <div className="preview-setup">
            <button
              className="setup-preview-toggle"
              aria-expanded={previewSetupOpen}
              onClick={() => {
                if (!previewSetup)
                  setPreviewSetup(defaultSetup(selectedRecipe.ingredients));
                setPreviewSetupOpen(!previewSetupOpen);
              }}
            >
              <span>Customize ingredients & stove</span>
              <span aria-hidden="true">{previewSetupOpen ? "−" : "+"}</span>
            </button>
            {previewSetupOpen && previewSetup && (
              <>
                <CookingSetupFields
                  ingredients={selectedRecipe.ingredients}
                  setup={previewSetup}
                  onChange={setPreviewSetup}
                  language={language}
                  disabled={busy}
                />
                <p className="field-help">
                  {adaptOnStart
                    ? "When you start, COOKer will review your setup and adapt the remaining procedure."
                    : !user
                      ? "Your setup is saved with this recipe. Sign in for COOKer to adapt the procedure."
                      : "Your setup is saved with this recipe. Heat guidance follows your selected stove."}
                </p>
              </>
            )}
          </div>
        )}
        <h3>Ingredients · {selectedRecipe.baseServings} people</h3>
        <ul className="preview-ingredients">
          {selectedRecipe.ingredients.map((ingredient) => {
            const measure = spiceMeasure(
              ingredient.name.en,
              ingredient.quantity,
              ingredient.unit,
            );
            return (
              <li key={ingredient.id}>
                <span>
                  {localize(ingredient.name, language)}
                  {ingredient.optional ? " · optional" : ""}
                </span>
                <strong>
                  {/to taste|as needed/i.test(measure.unit)
                    ? measure.unit
                    : `${quantity(measure.quantity)} ${measure.unit}`}
                </strong>
                {ingredient.allergens?.length ? (
                  <small>Contains {ingredient.allergens.join(", ")}</small>
                ) : null}
              </li>
            );
          })}
        </ul>
        {selectedRecipe.safetyNotes?.length ? (
          <div className="safety-notes">
            <h3>Before you start</h3>
            <ul>
              {selectedRecipe.safetyNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <h3>Recipe sources</h3>
        <div className="source-links">
          {selectedRecipe.sources.map((source) => (
            <a
              href={source.url}
              key={source.url}
              target="_blank"
              rel="noreferrer"
            >
              <strong>{source.name} ↗</strong>
              <small>
                {source.author}
                {source.note ? ` · ${source.note}` : ""}
              </small>
            </a>
          ))}
        </div>
        {session && (
          <p className="field-help">
            Your current cooking session stays in Saved sessions.
          </p>
        )}
        <button
          className="dialog-primary"
          disabled={busy}
          onClick={() => {
            if (recipeIntent === "inspect") {
              closeModal();
              return;
            }
            void perform("start", async () => {
              await props.onStartRecipe(
                selectedRecipe.id,
                previewSetup || undefined,
              );
              if (adaptOnStart) {
                setModal("chat");
                await props.onSendMessage(setupAdaptationRequest);
              } else closeModal();
            });
          }}
        >
          {recipeIntent === "inspect"
            ? "Back to cooking"
            : busyAction === "start"
              ? "Starting…"
              : adaptOnStart
                ? "Cook & adapt"
                : previewSetup
                  ? "Cook with my setup"
                  : "Cook this recipe"}{" "}
          <span>→</span>
        </button>
      </div>
    );
  }
  if (modal === "sessions") {
    dialogTitle = "Pick up where you paused.";
    dialogDescription = user
      ? "Cooking sessions saved with your account."
      : "Your cooking sessions on this device.";
    dialogContent = (
      <div className="saved-session-list">
        {sessions.length ? (
          sessions
            .slice()
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((item) => {
              const itemRecipe =
                item.recipeSnapshot ||
                recipes.find((r) => r.id === item.recipeId);
              return (
                <article className="saved-session" key={item.id}>
                  <div>
                    <span className="eyebrow">
                      {item.status === "completed"
                        ? "COMPLETED"
                        : item.id === session?.id
                          ? "CURRENT SESSION"
                          : item.status === "paused"
                            ? "PAUSED"
                            : "IN PROGRESS"}
                    </span>
                    <h3>
                      {itemRecipe
                        ? localize(itemRecipe.title, language)
                        : item.title}
                    </h3>
                    <p>
                      {item.servings} people · {item.cookware}
                      <br />
                      {item.completedStepIds.length} of {item.steps.length}{" "}
                      steps confirmed
                    </p>
                    <small>
                      {new Intl.DateTimeFormat(language, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.updatedAt))}
                    </small>
                  </div>
                  <button
                    className="pill"
                    disabled={busy}
                    onClick={() =>
                      void perform("resume", async () => {
                        await props.onResumeSession(item.id);
                        closeModal();
                      })
                    }
                  >
                    {item.status === "completed" ? "View" : "Resume"} →
                  </button>
                </article>
              );
            })
        ) : (
          <div className="empty-state">
            <h3>Your first session starts with a recipe.</h3>
            <p>
              Confirmed steps, changes, messages and timers will stay together.
            </p>
            <button className="pill" onClick={() => setModal("recipes")}>
              Find a recipe
            </button>
          </div>
        )}
      </div>
    );
  }
  if (modal === "chat") {
    dialogTitle = "Talk with COOKer.";
    dialogDescription = "Voice and typing share this cooking session.";
    dialogContent = (
      <>
        {session?.adaptations.length ? (
          <details className="confirmed-changes">
            <summary>
              Confirmed cooking changes · {session.adaptations.length}
            </summary>
            <ul>
              {session.adaptations.map((change) => (
                <li key={change.id}>{change.text}</li>
              ))}
            </ul>
          </details>
        ) : null}
        <div className="chat-history" aria-live="polite">
          {session && session.messages.length > chatLimit ? (
            <button
              className="pill older-messages"
              onClick={() => setChatLimit(chatLimit + 80)}
            >
              Show earlier messages
            </button>
          ) : null}
          {session?.messages.length ? (
            session.messages.slice(-chatLimit).map((item) => (
              <div
                className={`bubble ${item.role === "user" ? "user" : ""}`}
                key={item.id}
              >
                <span className="message-meta">
                  {item.role === "user" ? "You" : "COOKer"} ·{" "}
                  {item.channel === "voice" ? "Voice" : "Chat"}
                </span>
                {item.text}
              </div>
            ))
          ) : (
            <div className="chat-empty">
              <h3>What’s happening in your kitchen?</h3>
              <p>
                Tell me what you’ve already added, what changed, or where you
                need a hand.
              </p>
            </div>
          )}
          {props.streamingReply ? (
            <div className="bubble streaming-message">
              <span className="message-meta">COOKer · replying…</span>
              {props.streamingReply}
            </div>
          ) : chatPending ? (
            <div className="bubble pending-message" role="status">
              Working with your recipe…
            </div>
          ) : null}
          {props.liveTranscript && (
            <div className="bubble interim-message">
              <span className="message-meta">
                Heard so far · not yet confirmed
              </span>
              {props.liveTranscript}
            </div>
          )}
          <div ref={chatEnd} />
        </div>
        <form
          noValidate
          onSubmitCapture={validateForm}
          className="chat-form"
          onSubmit={(event) => void sendMessage(event)}
        >
          <label className="sr-only" htmlFor="cooking-message">
            Your cooking message
          </label>
          <KitchenTextarea
            inputRef={chatInput}
            id="cooking-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What changed, or what would you like to know?"
            rows={2}
            maxLength={4000}
          />
          <button
            disabled={
              !message.trim() ||
              !props.user ||
              chatPending ||
              busy ||
              !online ||
              props.chatAvailable === false
            }
            type="submit"
          >
            {chatPending ? "Thinking…" : "Send"}
          </button>
        </form>
        {!props.user ? (
          <div className="chat-auth-entry">
            <p>Sign in to chat with COOKer. Your draft will stay here.</p>
            <button
              className="pill"
              type="button"
              onClick={() => setModal("account")}
            >
              Sign in to chat
            </button>
          </div>
        ) : !online ? (
          <p className="field-help">
            You’re offline. Your recipe and confirmed steps are still available.
            Sending messages needs a connection.
          </p>
        ) : props.chatAvailable === false ? (
          <p className="field-help">
            Chat isn’t connected yet. You can still follow the recipe and save
            your steps.
          </p>
        ) : (
          <p className="field-help">
            Confirm ingredient names and amounts if a spoken transcript is
            uncertain.
          </p>
        )}
      </>
    );
  }
  if (modal === "adapt" && session && recipe) {
    const readyTomato = ingredients.find(
      (ingredient) =>
        /tomato/i.test(ingredient.name.en) &&
        !session.addedIngredients.some(
          (added) => added.ingredientId === ingredient.id,
        ),
    );
    dialogTitle = "Your kitchen, your call.";
    dialogDescription =
      "Keep the selected method. Change what needs to change.";
    dialogContent = (
      <>
        <button className="adapt-option" onClick={openSetup} disabled={busy}>
          <span className="adapt-mark">✓</span>
          <span>
            <strong>Ingredients & stove setup</strong>
            <small>Tick what you have and choose gas or induction.</small>
          </span>
        </button>
        {readyTomato && (
          <button
            className="adapt-option"
            disabled={busy}
            onClick={() =>
              void perform("ingredient", async () => {
                await props.onConfirmIngredient(readyTomato);
                closeModal();
              })
            }
          >
            <span className="adapt-mark">✓</span>
            <span>
              <strong>Tomatoes are already in</strong>
              <small>Record what you’ve added, without repeating it.</small>
            </span>
          </button>
        )}
        <button className="adapt-option" onClick={openCookware}>
          <span className="adapt-mark">
            <Icon name="light" />
          </span>
          <span>
            <strong>I’m using different cookware</strong>
            <small>Update the vessel without inventing a cooking time.</small>
          </span>
        </button>
        <button className="adapt-option" onClick={openServings}>
          <span className="adapt-mark">½</span>
          <span>
            <strong>I’m changing the quantity</strong>
            <small>Scale remaining quantities; keep confirmed additions.</small>
          </span>
        </button>
        <form
          noValidate
          onSubmitCapture={validateForm}
          className="adapt-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (adaptation.trim())
              void perform("adapt", async () => {
                await props.onSendMessage(adaptation.trim());
                setAdaptation("");
                closeModal();
              });
          }}
        >
          <label htmlFor="adaptation">Something else changed?</label>
          <KitchenTextarea
            id="adaptation"
            value={adaptation}
            onChange={(event) => setAdaptation(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Less oil, no coconut, tomatoes already in…"
          />
          <button
            className="dialog-primary"
            type="submit"
            disabled={
              !adaptation.trim() ||
              busy ||
              chatPending ||
              !online ||
              props.chatAvailable === false
            }
          >
            {busyAction === "adapt" ? "Updating…" : "Work from here"} →
          </button>
          <p className="field-help">
            Recipe changes that need a conversation require a connection.
            Ingredient and cookware confirmations can stay local.
          </p>
        </form>
      </>
    );
  }
  if (modal === "setup" && session && recipe && setupDraft) {
    const canAdapt = Boolean(user && online && props.chatAvailable !== false);
    dialogTitle = "Your kitchen, before we cook.";
    dialogDescription = "Use what you have. Keep what’s already in the pan.";
    dialogContent = (
      <form
        noValidate
        onSubmitCapture={validateForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!props.onCommand) return;
          void perform("setup", async () => {
            await props.onCommand!({
              type: "set_cooking_setup",
              setup: setupDraft,
            });
            if (canAdapt) {
              setModal("chat");
              await props.onSendMessage(setupAdaptationRequest);
            } else closeModal();
          });
        }}
      >
        <CookingSetupFields
          ingredients={ingredients}
          setup={setupDraft}
          onChange={setSetupDraft}
          language={language}
          disabled={busy || chatPending}
          addedIds={session.addedIngredients.map((item) => item.ingredientId)}
          recipe={recipe}
          session={session}
        />
        <button
          className="dialog-primary"
          type="submit"
          disabled={busy || chatPending || !props.onCommand}
        >
          {busyAction === "setup"
            ? "Saving setup…"
            : canAdapt
              ? "Save setup & adapt"
              : "Save setup"}
        </button>
        <p className="field-help">
          {canAdapt
            ? "Your selections are saved first. COOKer then reviews the procedure; changes appear only after they are saved."
            : "Your setup stays saved on this device. Sign in and connect for COOKer to adapt the procedure."}
        </p>
      </form>
    );
  }
  if (modal === "servings") {
    dialogTitle = "How many are eating?";
    dialogDescription =
      "Already-added ingredients stay recorded at their actual amounts.";
    dialogContent = (
      <form
        noValidate
        onSubmitCapture={validateForm}
        onSubmit={(event) => {
          event.preventDefault();
          const n = Number(servingDraft);
          if (Number.isInteger(n) && n >= 1 && n <= 100)
            void perform("servings", async () => {
              await props.onSetServings(n);
              closeModal();
            });
        }}
      >
        <label className="field-label" htmlFor="serving-count">
          People
        </label>
        <input
          className="quantity-input"
          id="serving-count"
          type="number"
          min={1}
          max={100}
          step={1}
          required
          value={servingDraft}
          onChange={(event) => setServingDraft(event.target.value)}
        />
        <p className="field-help">
          Cooking time, water and vessel size do not automatically scale in the
          same ratio.
        </p>
        <button className="dialog-primary" disabled={busy} type="submit">
          Update quantity →
        </button>
      </form>
    );
  }
  if (modal === "cookware") {
    const options = [
      ...new Set(
        [
          session?.cookware,
          ...(recipe?.equipment || []),
          "Iron pan",
          "Heavy-bottomed pot",
          "Pressure cooker",
          "Tawa",
          "Idli steamer",
        ].filter((value): value is string => !!value),
      ),
    ];
    dialogTitle = "What’s on the stove?";
    dialogDescription =
      "Changing the vessel doesn’t automatically change the selected recipe method.";
    dialogContent = (
      <form
        noValidate
        onSubmitCapture={validateForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (cookwareDraft.trim())
            void perform("cookware", async () => {
              await props.onSetCookware(cookwareDraft.trim());
              closeModal();
            });
        }}
      >
        <label className="field-label" htmlFor="cookware-choice">
          Cookware
        </label>
        <select
          className="field-select"
          id="cookware-choice"
          value={cookwareDraft}
          onChange={(event) => setCookwareDraft(event.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <p className="field-help">
          For a pressure-cooking or other major method change, use the
          conversation to confirm the remaining steps.
        </p>
        <button className="dialog-primary" disabled={busy} type="submit">
          Update cookware →
        </button>
      </form>
    );
  }
  if (modal === "voice") {
    dialogTitle = "Your kitchen. A little company.";
    dialogDescription = "Live voice with COOKer";
    dialogContent = (
      <div className="voice-view">
        <Cooker
          expanded
          status={voiceStatus}
          error={voiceError}
          transcript={props.liveTranscript}
          signedIn={Boolean(user)}
          available={props.voiceAvailable !== false}
          online={online}
        />
        {recipe && (
          <div className="voice-recipe-context">
            <span>Cooking now · {localize(recipe.title, language)}</span>
            <p>
              {step
                ? localize(step.instruction, language)
                : "Your confirmed cooking session is kept."}
            </p>
          </div>
        )}
        <div className="voice-view-actions">
          {!voiceActive && (
            <button
              className="dialog-primary"
              disabled={
                !online ||
                (user
                  ? props.voiceAvailable === false
                  : props.authAvailable === false)
              }
              onClick={() => void toggleVoice()}
            >
              <CookerIcon />
              {!user
                ? "Sign in to talk"
                : voiceStatus === "error"
                  ? "Retry voice"
                  : "Talk to COOKer"}
            </button>
          )}
          <button className="dialog-primary secondary" onClick={closeModal}>
            Back to recipe
          </button>
          <button className="voice-type-link" onClick={() => setModal("chat")}>
            Prefer typing? Open conversation
          </button>
        </div>
        <p className="field-help">
          {voiceActive
            ? "Closing this view keeps voice active. Pause voice to stop the microphone."
            : "Voice starts only when you choose Talk. Your cooking stays in the same session."}
        </p>
      </div>
    );
  }
  if (modal === "account") {
    dialogTitle = user ? "Your own kitchen." : "Keep your kitchen with you.";
    dialogDescription = user
      ? user.email
      : "An account can carry your sessions across your devices.";
    dialogContent = user ? (
      <>
        <p className="account-copy">
          Your recipes, confirmed steps, conversation and timers belong to your
          account.
        </p>
        <button
          className="dialog-primary secondary"
          disabled={busy || props.authPending}
          onClick={() =>
            void perform("signout", async () => {
              await props.onSignOut();
              closeModal();
            })
          }
        >
          Sign out
        </button>
      </>
    ) : props.authAvailable === false ? (
      <>
        <p className="account-copy">
          Account sync isn’t connected yet. Your cooking sessions remain saved
          on this device.
        </p>
        <button className="dialog-primary secondary" onClick={closeModal}>
          Continue on this device
        </button>
      </>
    ) : (
      <>
        <button
          className="dialog-primary"
          disabled={props.authPending || busy || !online}
          onClick={() => void perform("signin", () => props.onSignIn())}
        >
          {props.authPending ? "Connecting…" : "Continue with Google"} ↗
        </button>
        <div className="auth-divider">
          <span>or use your email</span>
        </div>
        <form
          noValidate
          onSubmitCapture={validateForm}
          onSubmit={(event) => {
            event.preventDefault();
            if (email.trim())
              void perform("email", () => props.onSignIn(email.trim()));
          }}
        >
          <label className="field-label" htmlFor="sign-in-email">
            Email address
          </label>
          <input
            id="sign-in-email"
            type="email"
            className="quantity-input"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
          <button
            className="dialog-primary secondary"
            disabled={props.authPending || busy || !online}
            type="submit"
          >
            Send sign-in link
          </button>
        </form>
        <p className="field-help">
          You can keep cooking on this device without signing in.
        </p>
      </>
    );
  }

  return (
    <div className="app">
      <main className="workspace">
        <a href="#cooking-content" className="skip-link">
          Skip to cooking
        </a>
        <header className="topbar">
          <button
            className="breadcrumb wordmark-button"
            onClick={() => setModal("recipes")}
            aria-label="Vantagallu recipe library"
          >
            vantagallu
          </button>
          <div className="top-actions">
            <button
              className="top-link nav-recipe"
              onClick={() => setModal("recipes")}
            >
              Recipes
            </button>
            <button className="top-link" onClick={() => setModal("sessions")}>
              Sessions
            </button>
            <span className={`save-state state-${saveStatus}`} role="status">
              <i />
              {statusText}
            </span>
            <label className="language">
              <span className="sr-only">Cooking language</span>
              <select
                value={language}
                disabled={busy}
                onChange={(event) =>
                  void perform("language", () =>
                    props.onLanguageChange(event.target.value as Language),
                  )
                }
              >
                {Object.entries(languageLabels).map(([id, label]) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="account-trigger"
              onClick={() => setModal("account")}
              aria-label={user ? "Open your account" : "Sign in"}
            >
              <Icon name="account" />
              <span>{user ? "Account" : "Sign in"}</span>
            </button>
          </div>
        </header>
        {!online && (
          <p className="connection-banner" role="status">
            You’re offline. Your saved recipe and cooking controls remain
            available; voice and chat need a connection.
          </p>
        )}
        {topError && (
          <div className="error-banner" role="alert">
            <p>{topError}</p>
            <button
              onClick={() => {
                setActionError(null);
                props.onDismissError?.();
              }}
              aria-label="Dismiss error"
            >
              <Icon name="close" />
            </button>
          </div>
        )}
        {!session || !recipe ? (
          <section id="cooking-content" className="welcome-kitchen">
            <p className="eyebrow">YOUR OWN SOUTH INDIAN KITCHEN</p>
            <h1>What’s cooking?</h1>
            <p>
              Pick a method that feels like home. We’ll take it one step at a
              time.
            </p>
            {sessions.some((item) => item.status !== "completed") && (
              <button
                className="resume-last"
                onClick={() => setModal("sessions")}
              >
                Pick up a saved cooking session <span>→</span>
              </button>
            )}
            <RecipeLibrary
              recipes={recipes}
              language={language}
              onSelect={chooseRecipe}
            />
          </section>
        ) : (
          <>
            <section className="dish-header" id="cooking-content">
              <div>
                <p className="eyebrow">
                  {finished
                    ? "YOUR SESSION, SAVED"
                    : session.status === "paused"
                      ? "COOKING PAUSED"
                      : "COOKING NOW"}
                </p>
                <h1>
                  {localize(recipe.title, language)}
                  <span className="dish-period">.</span>
                </h1>
                <p className="dish-subtitle">
                  {regions[recipe.region]} <span>·</span> {recipe.authorMethod}
                </p>
              </div>
              <div className="session-tools">
                <button
                  className="pill"
                  onClick={openSetup}
                  disabled={busy || finished}
                >
                  Cooking setup
                  {session.cookingSetup?.unavailableIngredientIds.length
                    ? ` · ${session.cookingSetup.unavailableIngredientIds.length} missing`
                    : ""}{" "}
                  ⌄
                </button>
                <button className="pill" onClick={openServings} disabled={busy}>
                  {session.servings} people ⌄
                </button>
                <button
                  className="pill cookware-pill"
                  onClick={openCookware}
                  disabled={busy}
                >
                  {session.cookware} ⌄
                </button>
                <button
                  className="pill"
                  onClick={() => setModal("adapt")}
                  disabled={busy || finished}
                >
                  Adjust as I cook ↗
                </button>
                <button
                  className="source-button"
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setRecipeIntent("inspect");
                    setModal("recipe");
                  }}
                >
                  Method & source
                </button>
              </div>
            </section>
            {updatedRecipe && (
              <section
                className="recipe-update"
                aria-label="Updated recipe method"
              >
                <p>
                  <strong>Updated recipe available</strong>
                  <span>
                    Your current cooking stays saved. Start the updated method
                    as a new session.
                  </span>
                </p>
                <button
                  className="pill"
                  disabled={busy}
                  onClick={() => chooseRecipe(updatedRecipe)}
                >
                  See updated method ↗
                </button>
              </section>
            )}
            <div className="cooker-entry">
              <Cooker
                status={voiceStatus}
                error={voiceError}
                transcript={props.liveTranscript}
                signedIn={Boolean(user)}
                available={props.voiceAvailable !== false}
                online={online}
              />
              <button
                className="cooker-open-view"
                onClick={() => setModal("voice")}
              >
                <CookerIcon />
                Open voice view<span aria-hidden="true">↗</span>
              </button>
            </div>
            {session.status === "paused" && (
              <div className="paused-banner">
                <p>
                  This cooking session is paused.{" "}
                  {visibleTimers.some((timer) => timer.status === "running")
                    ? "Your running timers continue."
                    : "Your confirmed steps are kept."}
                </p>
                {props.onCommand && (
                  <button
                    className="pill"
                    onClick={() =>
                      void perform("status", () =>
                        props.onCommand!({
                          type: "set_status",
                          status: "cooking",
                        }),
                      )
                    }
                  >
                    Resume cooking
                  </button>
                )}
              </div>
            )}
            <section className="board" aria-label="Live cooking board">
              <div className="main-board">
                <div className="board-top">
                  <span className="step-count">
                    {finished ? "FINISHED" : "STEP"}{" "}
                    <b>
                      {finished
                        ? `${session.steps.length} OF ${session.steps.length}`
                        : `${Math.max(0, stepIndex) + 1} OF ${session.steps.length}`}
                    </b>
                    <span className="stage-dots" aria-hidden="true">
                      {session.steps.map((item) => (
                        <i
                          key={item.id}
                          className={
                            session.completedStepIds.includes(item.id) ||
                            item.id === step?.id
                              ? "done"
                              : ""
                          }
                        />
                      ))}
                    </span>
                  </span>
                  <span className="heat">
                    {step?.heat !== "off" && !finished ? (
                      <svg viewBox="0 0 16 20" aria-hidden="true">
                        <path
                          d="M8 1C9 7 15 8 14 13C13 20 2 20 2 13C2 9 6 7 6 4C8 7 9 9 8 1"
                          fill="#CC3E2C"
                        />
                      </svg>
                    ) : null}
                    {finished
                      ? "Stove off when finished"
                      : heatGuide?.label || "Check your heat"}
                  </span>
                </div>
                {!finished && heatGuide && (
                  <p className="heat-guide">{heatGuide.detail}</p>
                )}
                <div className="instruction" aria-live="polite">
                  <h2>
                    {finished
                      ? "A little cooking, your way."
                      : step
                        ? localize(step.instruction, language)
                        : "Your next step is being restored."}
                  </h2>
                  <p>
                    {finished
                      ? "Your confirmed ingredients, changes and conversation stay with this session."
                      : step?.description
                        ? localize(step.description, language)
                        : "Follow the checkpoint, and tell me if something changes."}
                  </p>
                </div>
                <CookingPan
                  cookware={session.cookware}
                  addedIngredients={session.addedIngredients.map(
                    (added) =>
                      ingredients.find(
                        (ingredient) => ingredient.id === added.ingredientId,
                      )?.name.en || added.ingredientId,
                  )}
                  finished={finished}
                />
                <div className="timers">
                  {visibleTimers.map((timer) => (
                    <TimerControl
                      key={timer.id}
                      timer={timer}
                      now={now}
                      busy={busy}
                      onAction={(action, target) =>
                        perform("timer", () =>
                          props.onTimerAction(action, target),
                        ).then(() => undefined)
                      }
                    />
                  ))}
                  {step?.durationSeconds &&
                  !visibleTimers.some((timer) => timer.stepId === step.id) &&
                  !finished ? (
                    <button
                      className="timer timer-start"
                      disabled={busy}
                      onClick={() =>
                        void perform("timer", () =>
                          props.onTimerAction("start"),
                        )
                      }
                    >
                      <Icon name="clock" />
                      Start{" "}
                      {step.durationSeconds < 60
                        ? `${step.durationSeconds} sec`
                        : duration(step.durationSeconds)}{" "}
                      timer
                    </button>
                  ) : null}
                  {session.adaptations.length ? (
                    <button
                      className="version-chip show"
                      onClick={() => setModal("chat")}
                    >
                      Your plan · {session.adaptations.length}{" "}
                      {session.adaptations.length === 1 ? "change" : "changes"}
                    </button>
                  ) : null}
                </div>
                <div className="step-context">
                  <Icon name="light" />
                  <span>
                    {step?.checkpoint
                      ? localize(step.checkpoint, language)
                      : finished
                        ? "A timer ending does not confirm doneness. Use the recipe’s sensory and safety checks."
                        : "Your cooking board follows what you confirm. Tell me if the plan changes."}
                  </span>
                </div>
              </div>
              <aside
                className="ingredient-rail"
                aria-label="Ingredients ready and added"
              >
                <div className="rail-head">
                  <h3>On your counter</h3>
                  <span>
                    {
                      new Set(
                        session.addedIngredients.map(
                          (item) => item.ingredientId,
                        ),
                      ).size
                    }{" "}
                    of {ingredients.length} added
                  </span>
                </div>
                <p className="sr-only" id="ingredient-confirmation-help">
                  Select an ingredient to record its remaining amount as added.
                  Already-added amounts are kept.
                </p>
                <p
                  className="ingredient-scroll-hint"
                  id="ingredient-scroll-help"
                >
                  Scroll for ingredients <span aria-hidden="true">↕</span>
                </p>
                <div
                  className="ingredients"
                  role="region"
                  aria-label="Recipe ingredients"
                  aria-describedby="ingredient-scroll-help ingredient-confirmation-help"
                  tabIndex={0}
                >
                  {ingredients.map((ingredient) => {
                    const additions = session.addedIngredients.filter(
                      (item) => item.ingredientId === ingredient.id,
                    );
                    const added = additions[0];
                    const amounts = ingredientAmount(
                      recipe,
                      session,
                      ingredient,
                    );
                    const complete = amounts.remaining <= 0.0001;
                    const missing =
                      session.cookingSetup?.unavailableIngredientIds.includes(
                        ingredient.id,
                      ) && !added;
                    const amount = added ? amounts.added : amounts.target;
                    const measure = spiceMeasure(
                      ingredient.name.en,
                      amount,
                      added?.unit || ingredient.unit,
                    );
                    return (
                      <button
                        className={`ingredient-item ${added ? "added" : ""}`}
                        key={ingredient.id}
                        aria-describedby="ingredient-confirmation-help"
                        aria-pressed={added && !complete ? "mixed" : complete}
                        disabled={
                          busy || complete || finished || Boolean(missing)
                        }
                        onClick={() =>
                          void perform("ingredient", () =>
                            props.onConfirmIngredient(ingredient),
                          )
                        }
                      >
                        <span className="veg">
                          <IngredientDrawing name={ingredient.name.en} />
                        </span>
                        <span className="ingredient-name">
                          {localize(ingredient.name, language)}
                          <small>
                            {/to taste|as needed/i.test(measure.unit)
                              ? measure.unit
                              : `${quantity(measure.quantity)} ${measure.unit}`}
                            {ingredient.optional ? " · optional" : ""}
                          </small>
                        </span>
                        <span className="ingredient-state">
                          {complete
                            ? "Added"
                            : missing
                              ? "Missing · setup"
                              : added
                                ? "Add rest"
                                : step?.ingredientIds.includes(ingredient.id)
                                  ? "Ready"
                                  : "Later"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="rail-separator" />
                <p className="rail-note">
                  <strong>Recipes leave room for you.</strong>Already added
                  something?
                  <br />
                  Changed your cookware?
                  <br />
                  Tell me. We’ll work from here.
                </p>
              </aside>
            </section>
            {!finished && (
              <div className="adapt-link">
                <button onClick={() => setModal("chat")}>
                  Something changed? Tell me, in your own words.
                </button>
              </div>
            )}
            <div className="controls-wrap">
              <div className="controls">
                <div className="talk-type">
                  <button
                    className={`talk-button ${voiceActive ? "active" : ""}`}
                    onClick={() => void toggleVoice()}
                    disabled={
                      !voiceActive &&
                      (!online ||
                        (props.user
                          ? props.voiceAvailable === false
                          : props.authAvailable === false) ||
                        busy)
                    }
                    aria-pressed={voiceActive}
                  >
                    <CookerIcon />
                    <span>
                      {voiceActive
                        ? "Pause voice"
                        : !props.user
                          ? "Sign in to talk"
                          : voiceLabels[voiceStatus]}
                    </span>
                  </button>
                  <button
                    className="type-button"
                    onClick={() => setModal("chat")}
                    aria-label="Type a cooking message"
                  >
                    <Icon name="chat" />
                    <span>Type</span>
                  </button>
                </div>
                <button
                  className="next-button"
                  disabled={busy || finished || !step}
                  onClick={() => void perform("advance", props.onAdvance)}
                >
                  <span>
                    {finished
                      ? "Session saved"
                      : busyAction === "advance"
                        ? "Saving…"
                        : stepIndex === session.steps.length - 1
                          ? "Finish cooking"
                          : "Next step"}
                  </span>
                  <span aria-hidden="true">{finished ? "✓" : "→"}</span>
                </button>
              </div>
              <p className="bottom-note">
                {!online
                  ? "Offline · confirmed steps stay on this device"
                  : !props.user
                    ? "Sign in for voice and chat · your steps are saved on this device"
                    : props.voiceAvailable === false
                      ? "Voice isn’t connected yet · recipe controls are available"
                      : voiceActive
                        ? "Voice is active · pause to stop the microphone"
                        : "Your recipe. Your pace. Your cooking, kept together."}
              </p>
            </div>
          </>
        )}
        <dialog
          ref={dialog}
          className={
            modal === "recipes"
              ? "library-dialog"
              : modal === "voice"
                ? "voice-dialog"
                : ""
          }
          aria-labelledby="kitchen-dialog-title"
          onCancel={closeModal}
          onClose={() => {
            if (modal) setModal(null);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              const rect = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
              )
                closeModal();
            }
          }}
        >
          <div className="dialog-head">
            <div>
              <h2 id="kitchen-dialog-title">{dialogTitle}</h2>
              {dialogDescription && <p>{dialogDescription}</p>}
            </div>
            <div className="dialog-head-actions">
              {voiceActive && (
                <button
                  className="dialog-pause-voice"
                  onClick={() => void toggleVoice()}
                >
                  <CookerIcon />
                  <span>Pause voice</span>
                </button>
              )}
              <button
                className="close"
                onClick={closeModal}
                aria-label="Close dialog"
              >
                <Icon name="close" />
              </button>
            </div>
          </div>
          <div className="dialog-body">
            {dialogContent}
            {(actionError || props.error) && (
              <p className="dialog-error" role="alert" id="kitchen-form-error">
                {actionError || props.error}
              </p>
            )}
            {modal === "account" && props.authMessage && (
              <p className="auth-message" role="status">
                {props.authMessage}
              </p>
            )}
          </div>
        </dialog>
      </main>
    </div>
  );
}
