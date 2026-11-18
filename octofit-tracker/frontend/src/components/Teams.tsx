import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => setTeams(result))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section aria-labelledby="teams-heading">
      <h2 id="teams-heading">Teams</h2>
      <p>Manage teams and members.</p>
      {loading ? <p role="status">Loading teams...</p> : null}
      {error ? <p role="alert">Unable to load teams: {error}</p> : null}
      {!loading && !error && teams.length === 0 ? <p>No teams yet.</p> : null}
      {!loading && !error && teams.length > 0 ? (
        <ul className="list-group">
          {teams.map((team, index) => (
            <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
              <strong>{team.name}</strong> — Mascot: {team.mascot}; Members: {team.members.length}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
