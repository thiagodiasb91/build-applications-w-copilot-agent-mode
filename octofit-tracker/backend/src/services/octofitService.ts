import { Activity, Team, User, Workout } from '../models/index.js';

type InputRecord = Record<string, unknown>;

class HttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'HttpError';
  }
}

function isRecord(input: unknown): input is InputRecord {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function requiredString(input: InputRecord, field: string): string {
  const value = input[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(`${field} is required`, 400);
  }
  return value.trim();
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw new HttpError('Activity details are required', 400);
  const userId = requiredString(input, 'userId');
  const teamId = requiredString(input, 'teamId');
  const type = requiredString(input, 'type');
  const minutes = input.minutes;
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw new HttpError('minutes must be a positive whole number', 400);
  }
  if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(teamId)) {
    throw new HttpError('userId and teamId must be valid ObjectIds', 400);
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw new HttpError('The specified user or team does not exist', 404);
  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw new HttpError('Team details are required', 400);
  const name = requiredString(input, 'name');
  const mascot = requiredString(input, 'mascot');
  const memberIds = input.members === undefined ? [] : input.members;
  if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))) {
    throw new HttpError('members must be an array of valid user ObjectIds', 400);
  }
  const members = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (members.length !== memberIds.length) throw new HttpError('One or more team members do not exist', 404);
  return Team.create({ name, mascot, members: members.map((member) => member._id) });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: import('mongoose').Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

function activityFocus(type: string): string {
  const normalized = type.toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking'].includes(normalized)) return 'endurance';
  if (['strength', 'weights', 'weight training'].includes(normalized)) return 'strength';
  return normalized;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw new HttpError('User not found', 404);

  const [recentActivities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.toLowerCase();
  const recentFocus = recentActivities.length > 0 ? activityFocus(recentActivities[0].type) : undefined;
  const preferredFocus = workouts.some((workout) => workout.focus.toLowerCase() === goal)
    ? goal
    : recentFocus;
  const ordered = [...workouts].sort((left, right) => {
    const leftMatches = preferredFocus && left.focus.toLowerCase() === preferredFocus ? 1 : 0;
    const rightMatches = preferredFocus && right.focus.toLowerCase() === preferredFocus ? 1 : 0;
    return rightMatches - leftMatches || left.title.localeCompare(right.title);
  });

  return ordered.slice(0, 3).map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === goal
      ? `Recommended to support your ${user.fitnessGoal} fitness goal.`
      : recentFocus && workout.focus.toLowerCase() === recentFocus
        ? `Recommended based on your recent ${recentActivities[0].type} activity.`
        : 'Recommended as a way to build a balanced fitness routine.',
  }));
}
