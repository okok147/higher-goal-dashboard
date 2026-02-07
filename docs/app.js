const STORAGE_PREFIX = "daily_goal_dashboard";

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

function formatValue(current, target, unit) {
  if (unit === "HKD") {
    return `${Number(current).toLocaleString()} / ${Number(target).toLocaleString()} ${unit}`;
  }
  if (unit === "%") {
    return `${current}${unit} / ${target}${unit}`;
  }
  return `${current} / ${target} ${unit || ""}`.trim();
}

function progressPercent(current, target) {
  if (!target || Number(target) <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((Number(current) / Number(target)) * 100)));
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

function loadCheckState(key, size) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return new Array(size).fill(false);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Array(size).fill(false);
    }
    const normalized = parsed.map(Boolean);
    while (normalized.length < size) {
      normalized.push(false);
    }
    return normalized.slice(0, size);
  } catch {
    return new Array(size).fill(false);
  }
}

function saveCheckState(key, values) {
  localStorage.setItem(key, JSON.stringify(values));
}

function renderChecklist(containerId, items, storageKeyBase, dateKey, onChange) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const storageKey = `${STORAGE_PREFIX}:${storageKeyBase}:${dateKey}`;
  const states = loadCheckState(storageKey, items.length);

  items.forEach((item, index) => {
    const li = document.createElement("li");
    const label = document.createElement("label");
    label.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(states[index]);

    const text = document.createElement("span");
    text.textContent = typeof item === "string" ? item : item.title;
    if (checkbox.checked) {
      text.classList.add("done");
    }

    checkbox.addEventListener("change", () => {
      states[index] = checkbox.checked;
      text.classList.toggle("done", checkbox.checked);
      saveCheckState(storageKey, states);
      if (onChange) {
        onChange();
      }
    });

    label.appendChild(checkbox);
    label.appendChild(text);
    li.appendChild(label);
    container.appendChild(li);
  });

  return { storageKey, states, count: items.length };
}

function renderTargets(targets) {
  const container = document.getElementById("target-cards");
  container.innerHTML = "";

  targets.forEach((target) => {
    const card = document.createElement("article");
    card.className = "target-card";

    const title = document.createElement("h4");
    title.textContent = target.name;

    const value = document.createElement("p");
    value.textContent = formatValue(target.current, target.target, target.unit);

    const progress = document.createElement("div");
    progress.className = "mini-progress";
    const fill = document.createElement("span");
    fill.style.width = `${progressPercent(target.current, target.target)}%`;
    progress.appendChild(fill);

    card.appendChild(title);
    card.appendChild(value);
    card.appendChild(progress);
    container.appendChild(card);
  });
}

function renderSchedule(schedule) {
  const list = document.getElementById("schedule-list");
  list.innerHTML = "";

  schedule.forEach((block) => {
    const li = document.createElement("li");

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = block.time;

    const title = document.createElement("div");
    title.textContent = block.title;

    li.appendChild(time);
    li.appendChild(title);
    list.appendChild(li);
  });
}

function renderHistory(history) {
  const list = document.getElementById("history-list");
  list.innerHTML = "";

  if (!history.length) {
    const li = document.createElement("li");
    li.textContent = "No history yet. It will appear after daily updates run.";
    list.appendChild(li);
    return;
  }

  history.slice(-10).reverse().forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.date_local} (${entry.weekday}): ${entry.objective}`;
    list.appendChild(li);
  });
}

function renderNotes(dateKey) {
  const notes = document.getElementById("notes");
  const key = `${STORAGE_PREFIX}:notes:${dateKey}`;
  notes.value = localStorage.getItem(key) || "";
  notes.addEventListener("input", () => {
    localStorage.setItem(key, notes.value);
  });
}

async function boot() {
  try {
    const [goals, dailyPlan, history] = await Promise.all([
      fetchJson("./data/goals.json"),
      fetchJson("./data/daily-plan.json"),
      fetchJson("./data/history.json")
    ]);

    setText("owner-name", `${goals.owner} - Daily Wealth System`);
    setText("mission", goals.mission);
    setText("local-date", `${dailyPlan.date_local} (${dailyPlan.weekday})`);
    setText("timezone", dailyPlan.timezone);
    setText("last-updated", `Updated: ${dailyPlan.generated_at_utc}`);
    setText("today-objective", dailyPlan.objective);
    setText("accountability-text", dailyPlan.accountability);

    renderTargets(goals.quarter_targets || []);
    renderSchedule(dailyPlan.schedule || []);
    renderHistory(history || []);

    const dateKey = dailyPlan.date_local;
    let priorityState;
    let habitState;

    const updateCompletion = () => {
      const priorityChecks = loadCheckState(
        `${STORAGE_PREFIX}:priorities:${dateKey}`,
        priorityState.count
      ).filter(Boolean).length;
      const habitChecks = loadCheckState(
        `${STORAGE_PREFIX}:habits:${dateKey}`,
        habitState.count
      ).filter(Boolean).length;
      const completed = priorityChecks + habitChecks;
      const total = priorityState.count + habitState.count;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      document.getElementById("progress-fill").style.width = `${percent}%`;
      setText("completion-text", `${percent}% complete (${completed}/${total})`);
    };

    priorityState = renderChecklist(
      "top-priority-list",
      dailyPlan.top_priorities || [],
      "priorities",
      dateKey,
      updateCompletion
    );

    habitState = renderChecklist(
      "habit-list",
      goals.habits || [],
      "habits",
      dateKey,
      updateCompletion
    );

    renderNotes(dateKey);
    updateCompletion();
  } catch (error) {
    console.error(error);
    document.body.innerHTML = `<main style=\"max-width:760px;margin:42px auto;font-family:sans-serif;color:#fff\"><h1>Dashboard failed to load</h1><p>${error.message}</p></main>`;
  }
}

boot();
