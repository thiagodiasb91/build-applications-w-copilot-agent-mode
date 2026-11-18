import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: result }) => setLeaderboard(result))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section aria-labelledby="leaderboard-heading">
      <h2 id="leaderboard-heading">Leaderboard</h2>
      <p>Compare team point totals.</p>
      {loading ? <p role="status">Loading leaderboard...</p> : null}
      {error ? <p role="alert">Unable to load leaderboard: {error}</p> : null}
      {!loading && !error && leaderboard.length === 0 ? <p>No leaderboard rankings yet.</p> : null}
      {!loading && !error && leaderboard.length > 0 ? (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li className="list-group-item" key={entry.teamName}>
              {entry.teamName} — {entry.totalPoints} points
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
