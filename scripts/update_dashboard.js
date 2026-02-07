#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "docs", "data");
const GOALS_PATH = path.join(DATA_DIR, "goals.json");
const DAILY_PATH = path.join(DATA_DIR, "daily-plan.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getTimeParts(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long"
  });

  const parts = formatter.formatToParts(new Date());
  const map = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return {
    dateLocal: `${map.year}-${map.month}-${map.day}`,
    weekday: map.weekday
  };
}

function weekNumber(inputDate) {
  const date = new Date(`${inputDate}T00:00:00Z`);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffDays = Math.floor((date - start) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

function generatePlan(weekday, weekNo) {
  const workdayBase = [
    { time: "07:00-07:45", title: "Morning reset: mobility + learning + plan" },
    { time: "08:15-08:45", title: "Walk commute with audio learning" },
    { time: "09:00-18:00", title: "Main job shift (focus on safety and effort management)" },
    { time: "19:00-19:20", title: "Recovery, dinner, short reset" }
  ];

  const templates = {
    Monday: {
      objective: "Set weekly direction and execute one high-leverage business block.",
      top: [
        "Lock weekly KPI targets and top 3 outcomes",
        "Complete one deep skill-building block",
        "Send first outreach batch for the week"
      ],
      schedule: [
        ...workdayBase,
        { time: "19:20-20:20", title: "Weekly planning + KPI setup" },
        { time: "20:20-21:20", title: "Business build sprint" },
        { time: "21:20-22:00", title: "Outreach + daily review" }
      ]
    },
    Tuesday: {
      objective: "Improve offer quality and move pipeline forward.",
      top: [
        "Upgrade one client-facing asset",
        "Do one focused outreach sprint",
        "Track responses and book next follow-ups"
      ],
      schedule: [
        ...workdayBase,
        { time: "19:20-20:20", title: "Offer/portfolio improvement" },
        { time: "20:20-21:20", title: "Outreach sprint" },
        { time: "21:20-22:00", title: "CRM update + prop-firm review" }
      ]
    },
    Wednesday: {
      objective: "Maintain athletic progress while keeping business momentum.",
      top: [
        "Complete Kilterboard session with quality movement",
        "Finish one compact business task before climbing",
        "Protect recovery and sleep"
      ],
      schedule: [
        ...workdayBase,
        { time: "19:20-21:50", title: "Kilterboard session (2.5h)" },
        { time: "21:50-22:00", title: "Cooldown + tomorrow setup" }
      ]
    },
    Thursday: {
      objective: "Convert effort into opportunities with disciplined execution.",
      top: [
        "Ship one monetizable deliverable",
        "Run one outreach + follow-up block",
        "Complete risk-controlled trading review"
      ],
      schedule: [
        ...workdayBase,
        { time: "19:20-20:20", title: "Build/ship client deliverable" },
        { time: "20:20-21:20", title: "Outreach + follow-ups" },
        { time: "21:20-22:00", title: "Prop-firm review (rules first)" }
      ]
    },
    Friday: {
      objective: "Close the week strong with relationship, finance, and plan quality.",
      top: [
        "Weekly finance review and cashflow check",
        "Quality relationship time block",
        "Prepare high-clarity plan for weekend execution"
      ],
      schedule: [
        ...workdayBase,
        { time: "19:20-20:00", title: "Finance + KPI review" },
        { time: "20:00-21:30", title: "Relationship/social quality block" },
        { time: "21:30-22:00", title: "Weekend plan setup" }
      ]
    },
    Saturday: {
      objective: "Drive compounding through one deep build sprint and one recovery block.",
      top: [
        "Complete one deep business build sprint",
        "Run one focused outreach sprint",
        "Complete Kilterboard session or active recovery"
      ],
      schedule: [
        { time: "07:15-08:00", title: "Morning reset: mobility + learning + daily plan" },
        { time: "14:00-16:30", title: "Kilterboard session (2.5h)" },
        { time: "19:00-20:30", title: "Business build sprint" },
        { time: "20:30-21:15", title: "Outreach sprint" },
        { time: "21:15-22:00", title: "Review + next-day setup" }
      ]
    },
    Sunday: {
      objective: "Recover, reset, and prepare next week with precision.",
      top: [
        "Weekly review across income, health, and relationship KPIs",
        "Plan next week's top 3 outcomes",
        "Optional Kilterboard session if not done on Saturday"
      ],
      schedule: [
        { time: "08:00-08:45", title: "Morning reset + reflection" },
        { time: "14:00-16:30", title: "Kilterboard session (if skipped Saturday)" },
        { time: "19:00-20:00", title: "Weekly KPI review" },
        { time: "20:00-21:00", title: "Weekly planning and calendar lock" },
        { time: "21:00-22:00", title: "Prep assets for Monday execution" }
      ]
    }
  };

  const fallback = templates.Monday;
  const plan = templates[weekday] || fallback;

  if (weekday === "Saturday" || weekday === "Sunday") {
    const weekendClimbDay = weekNo % 2 === 0 ? "Saturday" : "Sunday";
    if (weekendClimbDay !== weekday) {
      plan.schedule = plan.schedule.map((item) => {
        if (item.title.includes("Kilterboard")) {
          return { ...item, title: "Active recovery walk + mobility (Kilterboard on alternate weekend day)" };
        }
        return item;
      });
    }
  }

  return plan;
}

function main() {
  const goals = readJson(GOALS_PATH, {});
  const timezone = goals.timezone || "Asia/Hong_Kong";
  const { dateLocal, weekday } = getTimeParts(timezone);
  const weekNo = weekNumber(dateLocal);
  const plan = generatePlan(weekday, weekNo);

  const dailyPlan = {
    generated_at_utc: new Date().toISOString(),
    date_local: dateLocal,
    weekday,
    timezone,
    objective: plan.objective,
    top_priorities: plan.top,
    schedule: plan.schedule,
    accountability: "Win today by completing top priorities before low-value tasks."
  };

  const history = readJson(HISTORY_PATH, []);
  const existingIndex = history.findIndex((entry) => entry.date_local === dateLocal);
  const todayEntry = {
    date_local: dateLocal,
    weekday,
    objective: plan.objective
  };

  if (existingIndex >= 0) {
    history[existingIndex] = todayEntry;
  } else {
    history.push(todayEntry);
  }

  while (history.length > 90) {
    history.shift();
  }

  writeJson(DAILY_PATH, dailyPlan);
  writeJson(HISTORY_PATH, history);

  console.log(`Updated dashboard data for ${dateLocal} (${weekday})`);
}

main();
