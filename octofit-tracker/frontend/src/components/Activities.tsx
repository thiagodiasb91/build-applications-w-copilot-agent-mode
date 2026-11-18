import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: result }) => setActivities(result))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section aria-labelledby="activities-heading">
      <h2 id="activities-heading">Activities</h2>
      <p>Track student activity minutes and points.</p>
      {loading ? <p role="status">Loading activities...</p> : null}
      {error ? <p role="alert">Unable to load activities: {error}</p> : null}
      {!loading && !error && activities.length === 0 ? <p>No activities yet.</p> : null}
      {!loading && !error && activities.length > 0 ? (
        <ul className="list-group">
          {activities.map((activity, index) => (
            <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
              {activity.type} - {activity.minutes} minutes - {activity.points} points
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
