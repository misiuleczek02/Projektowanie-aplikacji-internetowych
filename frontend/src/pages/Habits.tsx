import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Checkin {
  id: number;
  date: string;
}

interface Habit {
  id: number;
  name: string;
  description: string | null;
  category: Category;
  checkins: Checkin[];
  currentStreak: number;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function Habits() {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [h, c] = await Promise.all([
        api<Habit[]>('/habits'),
        api<Category[]>('/categories'),
      ]);
      setHabits(h);
      setCategories(c);
      if (c.length > 0 && categoryId === null) setCategoryId(c[0].id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addHabit() {
    if (!name.trim() || categoryId === null) return;
    await api<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify({ name, categoryId }),
    });
    setName('');
    load();
  }

  async function toggleToday(habit: Habit) {
    const today = todayIso();
    const done = habit.checkins.some((c) => c.date.startsWith(today));
    if (done) {
      await api(`/habits/${habit.id}/checkins/${today}`, { method: 'DELETE' });
    } else {
      await api(`/habits/${habit.id}/checkins`, {
        method: 'POST',
        body: JSON.stringify({ date: today }),
      });
    }
    load();
  }

  async function removeHabit(id: number) {
    await api(`/habits/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="container">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1>Moje nawyki</h1>
        <div>
          <span style={{ marginRight: '0.5rem', color: '#6b7280' }}>{user?.email}</span>
          <button onClick={logout}>Wyloguj</button>
        </div>
      </header>

      <div className="card" style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          placeholder="Nazwa nawyku"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          style={{ width: 'auto' }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="primary" onClick={addHabit}>
          Dodaj
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {habits.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Nie masz jeszcze żadnych nawyków. Dodaj pierwszy.</p>
      ) : (
        habits.map((habit) => {
          const today = todayIso();
          const doneToday = habit.checkins.some((c) => c.date.startsWith(today));
          return (
            <div key={habit.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{habit.name}</strong>{' '}
                  <span
                    style={{
                      background: habit.category.color,
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      marginLeft: '0.5rem',
                    }}
                  >
                    {habit.category.name}
                  </span>
                  {habit.currentStreak > 0 && (
                    <span
                      title="Dni z rzędu"
                      style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        marginLeft: '0.5rem',
                        fontWeight: 600,
                      }}
                    >
                      🔥 {habit.currentStreak}{' '}
                      {habit.currentStreak === 1 ? 'dzień' : 'dni'}
                    </span>
                  )}
                  {habit.description && (
                    <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>
                      {habit.description}
                    </p>
                  )}
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Wykonań w ostatnich 30 dniach: {habit.checkins.length}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={doneToday ? 'primary' : ''}
                    onClick={() => toggleToday(habit)}
                  >
                    {doneToday ? '✓ Dziś' : 'Odhacz dziś'}
                  </button>
                  <button onClick={() => removeHabit(habit.id)}>Usuń</button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
