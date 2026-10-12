const WeeklyChallenge = require("../models/WeeklyChallenge");

// Curated rotating prompts: (week number % number of prompts)
const PROMPTS = [
  {
    title: "Neon Streets",
    prompt: "Capture night cityscapes with high-contrast ambient silhouettes and solid neon accents.",
  },
  {
    title: "One Color Only",
    prompt: "A monochromatic study using variations and textures of a single dominant hue.",
  },
  {
    title: "Geometric Solitude",
    prompt: "Architectural shapes, negative space, and quiet isolated forms in stark lighting.",
  },
  {
    title: "Analog Horizon",
    prompt: "Retro-futuristic textures, grain, and warmth inspired by early print and vintage screens.",
  },
  {
    title: "Microscopic Worlds",
    prompt: "Extreme close-ups, hidden textures, and miniature landscapes found in everyday objects.",
  },
  {
    title: "Golden Hour Shadows",
    prompt: "Elongated shadows and low-angle amber rays carving deep geometric cuts across the frame.",
  },
  {
    title: "Brutalist Forms",
    prompt: "Raw structural weight, concrete angles, and uncompromising monumental compositions.",
  },
  {
    title: "Fluid Motion",
    prompt: "Dynamic movement frozen in time—smoke, splashing liquids, or streaking light.",
  },
];

/**
 * Calculates the Monday 00:00 UTC to next Monday 00:00 UTC window for any given date.
 */
function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday ...
  const daysSinceMonday = (day + 6) % 7;

  const startsAt = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() - daysSinceMonday,
      0,
      0,
      0,
      0
    )
  );

  const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  // ISO 8601 week number calculation
  const target = new Date(startsAt.valueOf());
  const dayNr = (startsAt.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);

  return { startsAt, endsAt, weekNumber };
}

/**
 * Idempotent weekly challenge resolver:
 * Returns the currently active challenge if one exists, creates a new one if not.
 * Driven by (week number % number of prompts) so prompts rotate automatically with no DB seeding needed.
 */
async function ensureWeeklyChallenge() {
  const now = new Date();

  // Find currently open challenge that spans the current timestamp
  let challenge = await WeeklyChallenge.findOne({
    $or: [
      { startsAt: { $lte: now }, endsAt: { $gt: now } },
      { starts_at: { $lte: now }, ends_at: { $gt: now } },
    ],
  }).sort({ startsAt: -1, starts_at: -1, createdAt: -1 });

  // If found and valid, backfill any missing fields and return
  if (challenge) {
    const ends = challenge.endsAt || challenge.ends_at;
    if (ends && new Date(ends) > now) {
      if (!challenge.title || !challenge.prompt || !challenge.startsAt || !challenge.endsAt) {
        challenge.title = challenge.title || challenge.theme;
        challenge.prompt = challenge.prompt || challenge.description;
        challenge.startsAt = challenge.startsAt || challenge.starts_at;
        challenge.endsAt = challenge.endsAt || challenge.ends_at;
        await challenge.save();
      }
      return challenge;
    }
  }

  // Otherwise calculate current Monday-Monday window and rotate prompt
  const { startsAt, endsAt, weekNumber } = getWeekBounds(now);
  const promptIdx = Math.abs(weekNumber) % PROMPTS.length;
  const promptData = PROMPTS[promptIdx];

  challenge = new WeeklyChallenge({
    title: promptData.title,
    prompt: promptData.prompt,
    startsAt,
    endsAt,
    theme: promptData.title,
    prompt_tag: promptData.title.toLowerCase().replace(/[^a-z0-9]+/g, ""),
    description: promptData.prompt,
    week_number: weekNumber,
    is_active: true,
    starts_at: startsAt,
    ends_at: endsAt,
    rules: [
      "Original photographic or visual craft",
      "Public frames only",
      "One entry per creator per weekly challenge",
    ],
  });

  await challenge.save();
  console.log(`[WeeklyChallenge] ensureWeeklyChallenge created: "${challenge.title}" (ends: ${endsAt.toISOString()})`);
  return challenge;
}

module.exports = {
  PROMPTS,
  getWeekBounds,
  ensureWeeklyChallenge,
};
