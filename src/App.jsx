import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ClipboardList } from "lucide-react";

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

const FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "active", label: "ยังไม่เสร็จ" },
  { id: "completed", label: "เสร็จแล้ว" },
];

const EMPTY_MESSAGES = {
  all: "ยังไม่มีงาน เริ่มเพิ่มงานแรกของคุณได้เลย",
  active: "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จ",
};

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high" },
    { id: 2, text: "ตอบอีเมลลูกค้า", done: false, priority: "medium" },
    { id: 3, text: "รดน้ำต้นไม้", done: true, priority: "low" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [removing, setRemoving] = useState([]);
  const nextId = useRef(4);
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId !== null && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((t) => [
      { id: nextId.current++, text: value, done: false, priority },
      ...t,
    ]);
    setText("");
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

  const remaining = todos.filter((t) => !t.done).length;
  const completedCount = todos.length - remaining;
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">
          รายการสิ่งที่ต้องทำ
        </h1>

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
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">ความสำคัญ</span>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                    priority === p
                      ? PRIORITIES[p].active
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {PRIORITIES[p].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
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
            const isRemoving = removing.includes(todo.id);
            return (
              <li
                key={todo.id}
                className={`overflow-hidden transition-all duration-200 ease-in ${
                  isRemoving
                    ? "max-h-0 -translate-x-6 opacity-0"
                    : "max-h-32 translate-x-0 opacity-100"
                }`}
              >
                <div
                  className={`mb-2 flex items-center gap-3 rounded-xl border-l-4 bg-white p-3 shadow-md sm:p-4 ${p.bar}`}
                >
                  <button
                    role="checkbox"
                    aria-checked={todo.done}
                    aria-label="ทำเครื่องหมายว่าเสร็จ"
                    onClick={() => toggle(todo.id)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
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
                          todo.done
                            ? "text-slate-400 line-through"
                            : "text-slate-900"
                        }`}
                      >
                        {todo.text}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => cyclePriority(todo.id)}
                    title="คลิกเพื่อเปลี่ยนความสำคัญ"
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                  >
                    {p.label}
                  </button>

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
            <p className="text-slate-500">{EMPTY_MESSAGES[filter]}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between px-1 text-sm text-slate-600">
          <span>เหลืออีก {remaining} งาน</span>
          <button
            onClick={() =>
              removeIds(todos.filter((t) => t.done).map((t) => t.id))
            }
            disabled={completedCount === 0}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-200/60 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            ล้างที่เสร็จแล้ว ({completedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
