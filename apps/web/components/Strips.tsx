/** Woven strips, one per language we collect data for. Decorative; each label is the language's own name. */
const STRIPS = [
  { name: "Hausa", w: 1.1 },
  { name: "Yorùbá", w: 1.4 },
  { name: "Igbo", w: 0.9 },
  { name: "Kiswahili", w: 1.3 },
  { name: "አማርኛ", w: 1 },
  { name: "isiZulu", w: 1.2 },
  { name: "Naijá", w: 0.9 },
];

export function Strips() {
  return (
    <ul className="strips" aria-label="Languages: Hausa, Yorùbá, Igbo, Kiswahili, Amharic, isiZulu, Nigerian Pidgin">
      {STRIPS.map((s, i) => (
        <li key={s.name} className={`strip s${i + 1}`} style={{ flexGrow: s.w, ["--i" as string]: i }}>
          <span lang={s.name === "አማርኛ" ? "am" : undefined}>{s.name}</span>
        </li>
      ))}
    </ul>
  );
}
