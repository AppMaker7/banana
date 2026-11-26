type Props = { selectedMuscle: string; onSelect: (muscle: string) => void };
const muscles = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Glutes", "Legs"];
type ZoneProps = { name: string; d: string; selectedMuscle: string; onSelect: (muscle: string) => void };
function Zone({ name, d, selectedMuscle, onSelect }: ZoneProps) {
  return <path className={selectedMuscle === name ? "banana-muscle-zone selected" : "banana-muscle-zone"} d={d} role="button" tabIndex={0} aria-label={name} aria-pressed={selectedMuscle === name} onClick={() => onSelect(name)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(name); } }} />;
}
const bodyPath = "M98 56 L98 68 Q78 68 62 77 L45 91 29 145 Q26 156 35 160 Q44 164 49 152 L63 113 66 180 Q67 199 80 216 L89 229 Q84 242 80 257 L76 278 79 326 68 397 Q66 409 77 411 Q88 413 92 400 L108 306 112 306 128 400 Q132 413 143 411 Q154 409 152 397 L141 326 144 278 140 257 Q136 242 131 229 L140 216 Q153 199 154 180 L157 113 171 152 Q176 164 185 160 Q194 156 191 145 L175 91 158 77 Q142 68 122 68 L122 56Z";
function Front({ selectedMuscle, onSelect }: Props) {
 return <svg className="banana-anatomy-figure" viewBox="0 0 220 430" role="group" aria-label="Front muscle map">
  <g className="banana-body-base"><circle cx="110" cy="35" r="23"/><path d={bodyPath}/></g>
  <g>
   <Zone name="Shoulders" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M49 75 Q68 62 91 67 L103 91 Q82 106 56 98Z M129 67 Q152 62 171 75 L164 98 Q138 106 117 91Z"/>
   <Zone name="Chest" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M66 101 Q86 91 108 100 L107 143 Q84 149 65 132Z M112 100 Q134 91 154 101 L155 132 Q136 149 113 143Z"/>
   <Zone name="Biceps" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M40 113 Q49 106 57 112 L52 169 Q44 179 37 166Z M163 112 Q171 106 180 113 L183 166 Q176 179 168 169Z"/>
   <Zone name="Core" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M78 146 Q110 155 142 146 L137 216 Q110 228 83 216Z"/>
   <Zone name="Legs" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M74 225 Q91 231 106 224 L99 304 83 335 72 321Z M114 224 Q129 231 146 225 L148 321 137 335 121 304Z"/>
   <Zone name="Legs" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M75 333 L87 329 94 367 84 399 Q75 406 69 397Z M133 329 L145 333 151 397 Q145 406 136 399 L126 367Z"/>
  </g>
  <g className="banana-anatomy-detail"><path d="M110 63V215 M66 138Q110 153 154 138 M80 174Q110 184 140 174 M84 194Q110 202 136 194 M72 217Q110 236 148 217 M110 226V301 M82 260Q94 270 103 260 M117 260Q126 270 138 260"/></g>
  <text className="banana-view-label" x="110" y="426">FRONT</text>
 </svg>;
}
function Back({ selectedMuscle, onSelect }: Props) {
 return <svg className="banana-anatomy-figure" viewBox="0 0 220 430" role="group" aria-label="Back muscle map">
  <g className="banana-body-base"><circle cx="110" cy="35" r="23"/><path d={bodyPath}/></g>
  <g>
   <Zone name="Shoulders" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M49 75 Q68 62 91 67 L103 91 Q82 106 56 98Z M129 67 Q152 62 171 75 L164 98 Q138 106 117 91Z"/>
   <Zone name="Triceps" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M40 113 Q49 106 57 112 L52 169 Q44 179 37 166Z M163 112 Q171 106 180 113 L183 166 Q176 179 168 169Z"/>
   <Zone name="Back" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M66 101 Q87 91 108 101 L105 181 Q85 194 69 171Z M112 101 Q133 91 154 101 L151 171 Q135 194 115 181Z"/>
   <Zone name="Glutes" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M73 211 Q91 200 108 211 L107 255 Q89 266 72 248Z M112 211 Q129 200 147 211 L148 248 Q131 266 113 255Z"/>
   <Zone name="Legs" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M72 258 Q90 266 106 258 L99 330 82 341 71 321Z M114 258 Q130 266 148 258 L149 321 138 341 121 330Z"/>
   <Zone name="Legs" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M75 337 L87 332 94 367 84 399 Q75 406 69 397Z M133 332 L145 337 151 397 Q145 406 136 399 L126 367Z"/>
  </g>
  <g className="banana-anatomy-detail"><path d="M110 64V208 M66 138Q110 162 154 138 M73 179Q110 198 147 179 M72 207Q110 194 148 207 M110 258V329 M82 286Q94 296 103 286 M117 286Q126 296 138 286"/></g>
  <text className="banana-view-label" x="110" y="426">BACK</text>
 </svg>;
}
export default function BodyDiagram({ selectedMuscle, onSelect }: Props) {
 return <section className="banana-anatomy" aria-label="Interactive muscle map">
  <div className="banana-anatomy-heading"><span>ANATOMY MAP</span><span>TAP A MUSCLE TO VIEW ITS RANK</span></div>
  <div className="banana-anatomy-views"><div className="banana-anatomy-view"><Front selectedMuscle={selectedMuscle} onSelect={onSelect}/></div><div className="banana-anatomy-view"><Back selectedMuscle={selectedMuscle} onSelect={onSelect}/></div></div>
  <div className="banana-anatomy-legend"><i/> SELECTED MUSCLE <span>•</span> TAP ANY HIGHLIGHTED REGION</div>
  <div className="banana-anatomy-chips">{muscles.map(m => <button type="button" key={m} className={selectedMuscle === m ? "active" : ""} aria-pressed={selectedMuscle === m} onClick={() => onSelect(m)}>{m}</button>)}</div>
 </section>;
}
