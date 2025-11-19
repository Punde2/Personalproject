"use client";

import { useEffect, useState } from "react";

// helpers
function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getWeekStartKey() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = (day + 6) % 7; // aantal dagen terug naar maandag
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
}

const STORAGE_KEY = "personal-dashboard-v1";

const DEFAULT_DAILY = {
  gym: false,
  school: false,
  work: false,
};

const DEFAULT_WEEKLY = {
  gym: 0,
  school: 0,
  work: 0,
};

export default function Home() {
  const [todayKey, setTodayKey] = useState(getTodayKey());
  const [weekStartKey, setWeekStartKey] = useState(getWeekStartKey());
  const [daily, setDaily] = useState(DEFAULT_DAILY);
  const [weekly, setWeekly] = useState(DEFAULT_WEEKLY);
  const [loaded, setLoaded] = useState(false);

  // load from localStorage
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const today = getTodayKey();
    const weekStart = getWeekStartKey();

    if (!stored) {
      setTodayKey(today);
      setWeekStartKey(weekStart);
      setDaily(DEFAULT_DAILY);
      setWeekly(DEFAULT_WEEKLY);
      setLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      // als week anders is => weekly resetten
      const sameWeek = parsed.weekStartKey === weekStart;
      const sameDay = parsed.todayKey === today;

      setTodayKey(today);
      setWeekStartKey(weekStart);

      setWeekly(sameWeek ? parsed.weekly ?? DEFAULT_WEEKLY : DEFAULT_WEEKLY);
      setDaily(sameDay ? parsed.daily ?? DEFAULT_DAILY : DEFAULT_DAILY);
    } catch (e) {
      setTodayKey(today);
      setWeekStartKey(weekStart);
      setDaily(DEFAULT_DAILY);
      setWeekly(DEFAULT_WEEKLY);
    }
    setLoaded(true);
  }, []);

  // save naar localStorage
  useEffect(() => {
    if (!loaded) return;
    const payload = {
      todayKey,
      weekStartKey,
      daily,
      weekly,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  }, [todayKey, weekStartKey, daily, weekly, loaded]);

  function toggleDaily(key) {
    setDaily((prev) => {
      const newVal = !prev[key];
      const updatedDaily = { ...prev, [key]: newVal };

      // weekly updaten op basis van verandering
      setWeekly((prevWeekly) => {
        const delta = newVal ? 1 : -1;
        const newCount = Math.max(0, (prevWeekly[key] ?? 0) + delta);
        return { ...prevWeekly, [key]: newCount };
      });

      return updatedDaily;
    });
  }

  const todayReadable = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const WEEK_GOAL_DAYS = 7;
  const weeklyPercent = (count) =>
    Math.min(100, Math.round((count / WEEK_GOAL_DAYS) * 100));

  return (
    <main className="page">
      {/* HERO */}
      <header className="hero">
        <div className="hero-inner">
          <div>
            <p className="hero-kicker">Personal Dashboard</p>
            <h1 className="hero-title">Today, Tomorrow, Forever</h1>
            <p className="hero-subtitle">
              Je eigen Aurora-style hub voor gym, school en werk. Zie in één
              oogopslag hoeveel je écht doet – dagelijks en wekelijks.
            </p>
          </div>
          <div className="hero-pill">
            <span className="hero-pill-label">Vandaag</span>
            <span className="hero-pill-date">{todayReadable}</span>
          </div>
        </div>
      </header>

      {/* GRID */}
      <section className="grid">
        {/* Vandaag – Big 3 */}
        <section className="card card-large">
          <h2>Vandaag&apos;s big 3</h2>
          <p className="card-subtitle">
            Focus op wat telt. Alles daarbuiten is bonus.
          </p>
          <ul className="task-list">
            <li>
              <input
                type="checkbox"
                id="gym"
                checked={daily.gym}
                onChange={() => toggleDaily("gym")}
              />
              <label htmlFor="gym">Gym / training</label>
            </li>
            <li>
              <input
                type="checkbox"
                id="school"
                checked={daily.school}
                onChange={() => toggleDaily("school")}
              />
              <label htmlFor="school">Studie / uni</label>
            </li>
            <li>
              <input
                type="checkbox"
                id="work"
                checked={daily.work}
                onChange={() => toggleDaily("work")}
              />
              <label htmlFor="work">Werk / business (224 / Langford)</label>
            </li>
          </ul>

          <p className="card-note">
            Tip: houd dit dashboard open tijdens de dag en vink pas af wanneer
            de taak écht klaar is.
          </p>
        </section>

        {/* Dagelijkse progressie */}
        <section className="card">
          <h3>Dagelijkse progressie</h3>
          <p className="card-subtitle">
            Hoeveel van je big 3 heb je vandaag al gekilld?
          </p>

          {["gym", "school", "work"].map((key) => {
            const label =
              key === "gym"
                ? "Gym"
                : key === "school"
                ? "Studie"
                : "Werk / business";
            const done = daily[key];
            return (
              <div className="progress-row" key={key}>
                <div className="progress-label">
                  <span>{label}</span>
                  <span>{done ? "✔️ Gedaan" : "⏳ Nog open"}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${done ? "full" : "empty"}`}
                    style={{ width: done ? "100%" : "20%" }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* Weekly overview */}
        <section className="card">
          <h3>Weekly overview</h3>
          <p className="card-subtitle">
            Hoeveel dagen deze week heb je each area aangetikt?
          </p>

          {["gym", "school", "work"].map((key) => {
            const label =
              key === "gym"
                ? "Gym"
                : key === "school"
                ? "Studie"
                : "Werk / business";
            const count = weekly[key] ?? 0;
            const pct = weeklyPercent(count);
            return (
              <div className="progress-row" key={key}>
                <div className="progress-label">
                  <span>{label}</span>
                  <span>
                    {count}/{WEEK_GOAL_DAYS} dagen ({pct}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill weekly`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          <p className="card-note">
            Week loopt vanaf maandag ({weekStartKey}). Nieuwe week = counters
            automatisch reset.
          </p>
        </section>

        {/* Habits */}
        <section className="card card-wide">
          <h2>Habits & lifestyle</h2>
          <p className="card-subtitle">
            Niet alleen output, maar ook de lifestyle die erbij hoort.
          </p>
          <div className="habit-grid">
            <div className="habit-item">
              <span className="habit-label">No phone voor 13:00</span>
              <span className="habit-streak">Check jezelf dagelijks</span>
            </div>
            <div className="habit-item">
              <span className="habit-label">2,5L water / dag</span>
              <span className="habit-streak">Combineer met gym & focus</span>
            </div>
            <div className="habit-item">
              <span className="habit-label">Lezen / journallen</span>
              <span className="habit-streak">10–20 min per dag is genoeg</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
