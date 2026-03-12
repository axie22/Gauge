'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadLog,
  saveEntry,
  deleteEntry,
  emptyEntry,
  entryHasData,
  lastNDays,
  NutritionEntry,
  NutritionLog,
} from '@/lib/nutrition';
import { NutritionCalendar } from '@/components/NutritionCalendar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNum(s: string): number | null {
  const v = parseFloat(s);
  return s.trim() !== '' && !isNaN(v) ? v : null;
}

function fmt(n: number | null, decimals = 0): string {
  if (n === null) return '—';
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// ─── Macro bar ────────────────────────────────────────────────────────────────

function MacroBar({ protein, carbs, fat }: { protein: number | null; carbs: number | null; fat: number | null }) {
  const pCal = (protein ?? 0) * 4;
  const cCal = (carbs ?? 0) * 4;
  const fCal = (fat ?? 0) * 9;
  const total = pCal + cCal + fCal;
  if (total === 0) return null;
  const pPct = (pCal / total) * 100;
  const cPct = (cCal / total) * 100;
  const fPct = (fCal / total) * 100;
  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-2 gap-px">
        <div className="bg-blue-500" style={{ width: `${pPct}%` }} title={`Protein ${pPct.toFixed(0)}%`} />
        <div className="bg-amber-400" style={{ width: `${cPct}%` }} title={`Carbs ${cPct.toFixed(0)}%`} />
        <div className="bg-rose-400" style={{ width: `${fPct}%` }} title={`Fat ${fPct.toFixed(0)}%`} />
      </div>
      <div className="flex gap-3 mt-1.5 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />{pPct.toFixed(0)}% protein</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />{cPct.toFixed(0)}% carbs</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />{fPct.toFixed(0)}% fat</span>
      </div>
    </div>
  );
}

// ─── Number input ─────────────────────────────────────────────────────────────

function NumInput({
  label,
  unit,
  value,
  onChange,
  placeholder = '—',
  highlight = false,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <div className={`flex items-center rounded-xl border bg-zinc-950 px-3 py-2.5 gap-2 transition-colors focus-within:ring-1 ${
        highlight
          ? 'border-indigo-700/60 focus-within:ring-indigo-500 focus-within:border-indigo-500'
          : 'border-zinc-700 focus-within:ring-indigo-500 focus-within:border-indigo-600'
      }`}>
        <input
          type="number"
          min={0}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none tabular-nums min-w-0"
        />
        <span className="text-xs text-zinc-500 shrink-0">{unit}</span>
      </div>
    </div>
  );
}

// ─── Entry form ───────────────────────────────────────────────────────────────

function EntryForm({
  entry,
  onSave,
  onDelete,
}: {
  entry: NutritionEntry;
  onSave: (e: NutritionEntry) => void;
  onDelete: () => void;
}) {
  const [calories, setCalories] = useState(entry.calories?.toString() ?? '');
  const [protein, setProtein] = useState(entry.protein_g?.toString() ?? '');
  const [carbs, setCarbs] = useState(entry.carbs_g?.toString() ?? '');
  const [fat, setFat] = useState(entry.fat_g?.toString() ?? '');
  const [fiber, setFiber] = useState(entry.fiber_g?.toString() ?? '');
  const [water, setWater] = useState(entry.water_ml?.toString() ?? '');
  const [notes, setNotes] = useState(entry.notes);
  const [saved, setSaved] = useState(false);

  // Reset form whenever the selected date changes
  useEffect(() => {
    setCalories(entry.calories?.toString() ?? '');
    setProtein(entry.protein_g?.toString() ?? '');
    setCarbs(entry.carbs_g?.toString() ?? '');
    setFat(entry.fat_g?.toString() ?? '');
    setFiber(entry.fiber_g?.toString() ?? '');
    setWater(entry.water_ml?.toString() ?? '');
    setNotes(entry.notes);
    setSaved(false);
  }, [entry.date]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    onSave({
      date: entry.date,
      calories: parseNum(calories),
      protein_g: parseNum(protein),
      carbs_g: parseNum(carbs),
      fat_g: parseNum(fat),
      fiber_g: parseNum(fiber),
      water_ml: parseNum(water),
      notes: notes.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    setCalories(''); setProtein(''); setCarbs(''); setFat('');
    setFiber(''); setWater(''); setNotes('');
    onDelete();
  }

  const hasAny = calories || protein || carbs || fat || fiber || water || notes;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full flex flex-col">
      {/* Date header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-100">
          {formatDate(entry.date)}
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">Enter your nutrition for this day</p>
      </div>

      <div className="flex-1 space-y-6">
        {/* Energy */}
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Energy
          </div>
          <NumInput label="Calories" unit="kcal" value={calories} onChange={setCalories} highlight />
        </div>

        {/* Macronutrients */}
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Macronutrients
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumInput label="Protein" unit="g" value={protein} onChange={setProtein} />
            <NumInput label="Carbohydrates" unit="g" value={carbs} onChange={setCarbs} />
            <NumInput label="Fat" unit="g" value={fat} onChange={setFat} />
          </div>

          {/* Live macro bar */}
          {(protein || carbs || fat) && (
            <div className="mt-3">
              <MacroBar
                protein={parseNum(protein)}
                carbs={parseNum(carbs)}
                fat={parseNum(fat)}
              />
            </div>
          )}
        </div>

        {/* Additional */}
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Additional
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <NumInput label="Fiber" unit="g" value={fiber} onChange={setFiber} />
            <NumInput label="Water" unit="ml" value={water} onChange={setWater} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meals, supplements, how you felt..."
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600 resize-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasAny}
          className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 transition-colors"
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
        {entryHasData(entry) && (
          <button
            onClick={handleClear}
            className="rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm font-medium px-4 py-2.5 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Weekly summary table ─────────────────────────────────────────────────────

function WeekSummary({ log, today }: { log: NutritionLog; today: string }) {
  const days = lastNDays(7);

  const rows = [
    { key: 'calories', label: 'Calories', unit: 'kcal', get: (e: NutritionEntry) => e.calories },
    { key: 'protein', label: 'Protein', unit: 'g', get: (e: NutritionEntry) => e.protein_g },
    { key: 'carbs', label: 'Carbs', unit: 'g', get: (e: NutritionEntry) => e.carbs_g },
    { key: 'fat', label: 'Fat', unit: 'g', get: (e: NutritionEntry) => e.fat_g },
    { key: 'fiber', label: 'Fiber', unit: 'g', get: (e: NutritionEntry) => e.fiber_g },
    { key: 'water', label: 'Water', unit: 'ml', get: (e: NutritionEntry) => e.water_ml },
  ];

  function avg(vals: (number | null)[]): number | null {
    const nums = vals.filter((v): v is number => v !== null);
    return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">7-Day Summary</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Rolling average of the last 7 days</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left text-zinc-500 font-medium pb-3 pr-4 w-24">Metric</th>
              {days.map((d) => (
                <th
                  key={d}
                  className={`text-center pb-3 px-2 font-medium ${
                    d === today ? 'text-indigo-400' : 'text-zinc-500'
                  }`}
                >
                  <div>{new Date(d + 'T12:00:00Z').toLocaleString('default', { weekday: 'short', timeZone: 'UTC' })}</div>
                  <div className="text-zinc-600 font-normal">
                    {new Date(d + 'T12:00:00Z').toLocaleString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  </div>
                </th>
              ))}
              <th className="text-center pb-3 px-2 text-zinc-400 font-semibold">Avg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, label, unit, get }) => {
              const vals = days.map((d) => (log[d] ? get(log[d]) : null));
              const average = avg(vals);
              return (
                <tr key={key} className="border-t border-zinc-800">
                  <td className="py-2.5 pr-4 text-zinc-400 font-medium whitespace-nowrap">
                    {label}
                    <span className="ml-1 text-zinc-600 font-normal">{unit}</span>
                  </td>
                  {vals.map((v, i) => (
                    <td
                      key={i}
                      className={`text-center py-2.5 px-2 tabular-nums ${
                        days[i] === today
                          ? 'text-indigo-300'
                          : v !== null
                          ? 'text-zinc-200'
                          : 'text-zinc-700'
                      }`}
                    >
                      {fmt(v)}
                    </td>
                  ))}
                  <td className="text-center py-2.5 px-2 font-semibold text-zinc-300 tabular-nums">
                    {fmt(average)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [log, setLog] = useState<NutritionLog>({});
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  useEffect(() => {
    setLog(loadLog());
  }, []);

  const refreshLog = useCallback(() => setLog(loadLog()), []);

  function handleSave(updated: NutritionEntry) {
    saveEntry(updated);
    refreshLog();
  }

  function handleDelete() {
    deleteEntry(selectedDate);
    refreshLog();
  }

  // When user clicks a date in a different month, navigate calendar to that month
  function handleSelectDate(date: string) {
    setSelectedDate(date);
    const d = new Date(date + 'T12:00:00Z');
    const firstOfMonth = new Date(d.getUTCFullYear(), d.getUTCMonth(), 1);
    if (
      firstOfMonth.getFullYear() !== currentMonth.getFullYear() ||
      firstOfMonth.getMonth() !== currentMonth.getMonth()
    ) {
      setCurrentMonth(firstOfMonth);
    }
  }

  const entry = log[selectedDate] ?? emptyEntry(selectedDate);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">Nutrition Log</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track daily calories, macros, and hydration to improve recovery insights
          </p>
        </div>

        {/* Calendar + Form */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-1">
            <NutritionCalendar
              log={log}
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              today={today}
              onSelectDate={handleSelectDate}
              onMonthChange={setCurrentMonth}
            />
          </div>
          <div className="lg:col-span-2">
            <EntryForm
              key={selectedDate}
              entry={entry}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* 7-day summary */}
        <WeekSummary log={log} today={today} />
      </div>
    </main>
  );
}
