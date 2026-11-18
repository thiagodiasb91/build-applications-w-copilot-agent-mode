import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const userEmail = 'mona@example.com';
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then(({ suggestions: result }) => setSuggestions(result))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section aria-labelledby="workouts-heading">
      <h2 id="workouts-heading">Workout suggestions</h2>
      <p>Recommend workouts from activity patterns.</p>
      {loading ? <p role="status">Loading workout suggestions...</p> : null}
      {error ? <p role="alert">Unable to load workout suggestions: {error}</p> : null}
      {!loading && !error && suggestions.length === 0 ? <p>No workout suggestions yet.</p> : null}
      {!loading && !error && suggestions.length > 0 ? (
        <ul className="list-group">
          {suggestions.map((workout, index) => (
            <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
              <strong>{workout.title}</strong> — {workout.focus}, {workout.minutes} minutes, {workout.difficulty}.
              <span className="d-block">{workout.reason}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
