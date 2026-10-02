import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Check,
  ClipboardList,
  Search,
  CalendarDays,
} from "lucide-react";

/* ---------- constants ---------- */

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bar: "border-l-emerald-400",
    active: "bg-emerald-500 text-white",
  },
  medium: {
    label: "ปานกลาง",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    bar: "border-l-amber-400",
    active: "bg-amber-500 text-white",
  },
  high: {
    label: "สูง",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    bar: "border-l-rose-500",
    active: "bg-rose-500 text-white",
  },
};
const ORDER = ["low", "medium", "high"];

const CATEGORIES = {
  work: { label: "งาน", dot: "bg-sky-500" },
  personal: { label: "ส่วนตัว", dot: "bg-violet-500" },
  shopping: { label: "ช้อปปิ้ง", dot: "bg-fuchsia-500" },
  health: { label: "สุขภาพ", dot: "bg-teal-500" },
};
const CAT_KEYS = Object.keys(CATEGORIES);

const FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "active", label: "ยังไม่เสร็จ" },
  { id: "completed", label: "เสร็จแล้ว" },
];

/* ---------- date helpers (local time, YYYY-MM-DD keys) ---------- */

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toKey(d);
};
const formatDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
};

function dueBadge(todo, today) {
  if (!todo.due) return null;
  const date = formatDate(todo.due);
  if (todo.done)
    return { text: date, cls: "bg-slate-100 text-slate-500 ring-slate-200" };
  if (todo.due < today)
    return { text: `เลยกำหนด ${date}`, cls: "bg-red-600 text-white ring-red-600" };
  if (todo.due === today)
    return { text: "วันนี้", cls: "bg-yellow-400 text-yellow-950 ring-yellow-400" };
  return { text: date, cls: "bg-slate-100 text-slate-700 ring-slate-200" };
}

/* ---------- donut chart ---------- */

function Donut({ segments, total, percent }) {
  let offset = 25; // start at 12 o'clock
  return (
    <svg viewBox="0 0 36 36" className="h-24 w-24 shrink-0" role="img" aria-label={`เสร็จแล้ว ${percent}%`}>
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="4" />
      {total > 0 &&
        segments.map((s) => {
          const pct = (s.value / total) * 100;
          const el =
            pct > 0 ? (
              <circle
                key={s.label}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke={s.color}
                strokeWidth="4"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={offset}
              />
            ) : null;
          offset -= pct;
          return el;
        })}
      <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="600" fill="#0f172a">
        {percent}%
      </text>
    </svg>
  );
}

/* ---------- app ---------- */

export default function TodoApp() {
  const [todos, setTodos] = useState(() => [
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", category: "work", due: dayOffset(-2) },
    { id: 2, text: "ตอบอีเมลลูกค้า", done: false, priority: "medium", category: "work", due: dayOffset(0) },
    { id: 3, text: "ซื้อผักและผลไม้", done: false, priority: "low", category: "shopping", due: dayOffset(2) },
    { id: 4, text: "ไปออกกำลังกาย", done: true, priority: "low", category: "health", due: dayOffset(-1) },
    { id: 5, text: "รดน้ำต้นไม้", done: true, priority: "low", category: "personal", due: "" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [removing, setRemoving] = useState([]);
  const nextId = useRef(6);
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId !== null && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  const today = toKey(new Date());

  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((t) => [
      { id: nextId.current++, text: value, done: false, priority, category, due },
      ...t,
    ]);
    setText("");
    setDue("");
  };

  const toggle = (id) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const cyclePriority = (id) =>
    setTodos((t) =>
      t.map((x) =>
        x.id === id
          ? { ...x, priority: ORDER[(ORDER.indexOf(x.priority) + 1) % 3] }
          : x
      )
    );

  const removeIds = (ids) => {
    setRemoving((r) => [...r, ...ids]);
    setTimeout(() => {
      setTodos((t) => t.filter((x) => !ids.includes(x.id)));
      setRemoving((r) => r.filter((id) => !ids.includes(id)));
    }, 250);
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    const value = editText.trim();
    if (value) {
      setTodos((t) =>
        t.map((x) => (x.id === editingId ? { ...x, text: value } : x))
      );
    }
    setEditingId(null);
  };

  /* derived data */
  const q = query.trim().toLowerCase();
  const visible = todos.filter(
    (t) =>
      (filter === "active" ? !t.done : filter === "completed" ? t.done : true) &&
      (catFilter === "all" || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  );

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const overdueCount = todos.filter((t) => !t.done && t.due && t.due < today).length;
  const doingCount = total - doneCount - overdueCount;
  const remaining = total - doneCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const segments = [
    { label: "เสร็จแล้ว", value: doneCount, color: "#10b981" },
    { label: "กำลังทำ", value: doingCount, color: "#94a3b8" },
    { label: "เลยกำหนด", value: overdueCount, color: "#ef4444" },
  ];

  const catCount = (key) => todos.filter((t) => t.category === key).length;
  const emptyMessage = q
    ? `ไม่พบงานที่ตรงกับ “${query.trim()}”`
    : total === 0
    ? "ยังไม่มีงาน เริ่มเพิ่มงานแรกของคุณได้เลย"
    : filter === "completed"
    ? "ยังไม่มีงานที่เสร็จ"
    : "ไม่มีงานในหมวดนี้";

  const sideItems = [
    { id: "all", label: "ทุกหมวด", count: total, dot: "bg-slate-400" },
    ...CAT_KEYS.map((k) => ({
      id: k,
      label: CATEGORIES[k].label,
      count: catCount(k),
      dot: CATEGORIES[k].dot,
    })),
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">
          รายการสิ่งที่ต้องทำ
        </h1>

        <div className="grid gap-4 md:grid-cols-[13rem_1fr]">
          {/* Category sidebar (chips on mobile) */}
          <nav
            aria-label="หมวดหมู่"
            className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1 md:self-start md:overflow-visible md:rounded-2xl md:bg-white md:p-2 md:shadow-md"
          >
            {sideItems.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
                  catFilter === c.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-100 md:bg-transparent md:shadow-none"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                <span className="flex-1 text-left">{c.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    catFilter === c.id ? "bg-white/20" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {c.count}
                </span>
              </button>
            ))}
          </nav>

          <main className="min-w-0">
            {/* Stats */}
            <div className="mb-4 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md">
              <Donut segments={segments} total={total} percent={percent} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-500">งานทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-900">
                  {total}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    · เสร็จแล้ว {percent}%
                  </span>
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  {segments.map((s) => (
                    <li key={s.label} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      {s.label} {s.value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Add form */}
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-md">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  onClick={addTodo}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                  {ORDER.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                        priority === p ? PRIORITIES[p].active : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      {PRIORITIES[p].label}
                    </button>
                  ))}
                </div>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="หมวดหมู่"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  {CAT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {CATEGORIES[k].label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-1.5 text-sm text-slate-500">
                  <CalendarDays size={16} />
                  <span>กำหนดส่ง</span>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-slate-400"
                  />
                </label>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* Status tabs */}
            <div className="mb-4 flex gap-1 rounded-xl bg-slate-200/60 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${
                    filter === f.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <ul>
              {visible.map((todo) => {
                const p = PRIORITIES[todo.priority];
                const cat = CATEGORIES[todo.category];
                const badge = dueBadge(todo, today);
                const isRemoving = removing.includes(todo.id);
                return (
                  <li
                    key={todo.id}
                    className={`overflow-hidden transition-all duration-200 ease-in ${
                      isRemoving
                        ? "max-h-0 -translate-x-6 opacity-0"
                        : "max-h-40 translate-x-0 opacity-100"
                    }`}
                  >
                    <div className={`mb-2 flex items-start gap-3 rounded-xl border-l-4 bg-white p-3 shadow-md sm:p-4 ${p.bar}`}>
                      <button
                        role="checkbox"
                        aria-checked={todo.done}
                        aria-label="ทำเครื่องหมายว่าเสร็จ"
                        onClick={() => toggle(todo.id)}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                          todo.done
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {todo.done && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingId === todo.id ? (
                          <input
                            ref={editRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => startEdit(todo)}
                            title="ดับเบิลคลิกเพื่อแก้ไข"
                            className={`block cursor-text select-none break-words ${
                              todo.done ? "text-slate-400 line-through" : "text-slate-900"
                            }`}
                          >
                            {todo.text}
                          </span>
                        )}

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            <span className={`h-2 w-2 rounded-full ${cat.dot}`} />
                            {cat.label}
                          </span>
                          <button
                            onClick={() => cyclePriority(todo.id)}
                            title="คลิกเพื่อเปลี่ยนความสำคัญ"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                          >
                            {p.label}
                          </button>
                          {badge && (
                            <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.cls}`}>
                              <CalendarDays size={12} />
                              {badge.text}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeIds([todo.id])}
                        aria-label="ลบงาน"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {visible.length === 0 && (
              <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-md">
                <ClipboardList size={36} className="mb-3 text-slate-300" />
                <p className="text-slate-500">{emptyMessage}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between px-1 text-sm text-slate-600">
              <span>เหลืออีก {remaining} งาน</span>
              <button
                onClick={() => removeIds(todos.filter((t) => t.done).map((t) => t.id))}
                disabled={doneCount === 0}
                className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-200/60 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                ล้างที่เสร็จแล้ว ({doneCount})
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
