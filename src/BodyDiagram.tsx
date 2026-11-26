import React from "react";

type Props = { selectedMuscle: string; onSelect: (muscle: string) => void };

const muscles = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Glutes", "Quads", "Hamstrings", "Calves"];

type ZoneProps = { name: string; d: string; selectedMuscle: string; onSelect: (muscle: string) => void };
function Zone({ name, d, selectedMuscle, onSelect }: ZoneProps) {
  return <path className={selectedMuscle === name ? "banana-muscle-zone selected" : "banana-muscle-zone"} d={d} role="button" tabIndex={0} aria-label={name} aria-pressed={selectedMuscle === name} onClick={() => onSelect(name)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(name); } }} />;
}

function Front({ selectedMuscle, onSelect }: Props) {
  return <svg className="banana-anatomy-figure" viewBox="0 0 220 430" role="group" aria-label="Front muscle map">
    <defs><linearGradient id="banana-skin-front" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F0E6C9"/><stop offset=".55" stopColor="#C9B995"/><stop offset="1" stopColor="#8F8065"/></linearGradient></defs>
    <g className="banana-body-base">
      <circle cx="110" cy="35" r="24"/><path d="M91 61 Q79 64 64 73 L47 88 31 145 Q28 157 37 160 Q46 162 50 150 L64 112 67 174 Q68 193 61 214 L53 256 Q51 270 64 276 L70 327 63 398 Q62 410 73 411 Q83 412 86 399 L107 305 113 305 134 399 Q137 412 147 411 Q158 410 157 398 L150 327 156 276 Q169 270 167 256 L159 214 Q152 193 153 174 L156 112 170 150 Q174 162 183 160 Q192 157 189 145 L173 88 156 73 Q141 64 129 61Z"/>
    </g>
    <g>
      <Zone name="Shoulders" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M65 77 Q78 66 91 68 L99 91 Q84 104 67 99Z M129 68 Q143 66 155 77 L153 99 Q136 104 121 91Z"/>
      <Zone name="Chest" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M72 101 Q89 91 108 101 L107 139 Q88 145 72 130Z M112 101 Q131 91 148 101 L148 130 Q132 145 113 139Z"/>
      <Zone name="Biceps" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M49 116 Q58 107 65 115 L58 169 Q52 177 46 166Z M155 115 Q163 107 171 116 L174 166 Q168 177 162 169Z"/>
      <Zone name="Core" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M83 143 Q109 151 137 143 L143 211 Q110 225 77 211Z"/>
      <Zone name="Quads" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M69 222 Q88 228 105 224 L99 302 82 333 68 321Z M115 224 Q133 228 151 222 L152 321 138 333 121 302Z"/>
      <Zone name="Calves" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M73 330 L85 326 92 365 82 399 Q73 406 67 397Z M135 326 L147 330 153 397 Q147 406 138 399 L128 365Z"/>
    </g>
    <g className="banana-anatomy-detail"><path d="M110 63V215 M72 138Q109 151 148 138 M78 178Q110 187 142 178 M84 197Q110 204 136 197 M67 214Q110 235 153 214 M109 225V300 M80 260Q92 270 101 260 M119 260Q129 270 141 260"/></g>
    <text className="banana-view-label" x="110" y="426">FRONT</text>
  </svg>;
}

function Back({ selectedMuscle, onSelect }: Props) {
  return <svg className="banana-anatomy-figure" viewBox="0 0 220 430" role="group" aria-label="Back muscle map">
    <g className="banana-body-base"><circle cx="110" cy="35" r="24"/><path d="M91 61 Q79 64 64 73 L47 88 31 145 Q28 157 37 160 Q46 162 50 150 L64 112 67 174 Q68 193 61 214 L53 256 Q51 270 64 276 L70 327 63 398 Q62 410 73 411 Q83 412 86 399 L107 305 113 305 134 399 Q137 412 147 411 Q158 410 157 398 L150 327 156 276 Q169 270 167 256 L159 214 Q152 193 153 174 L156 112 170 150 Q174 162 183 160 Q192 157 189 145 L173 88 156 73 Q141 64 129 61Z"/></g>
    <g>
      <Zone name="Shoulders" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M65 77 Q78 66 91 68 L99 91 Q84 104 67 99Z M129 68 Q143 66 155 77 L153 99 Q136 104 121 91Z"/>
      <Zone name="Triceps" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M49 116 Q58 107 65 115 L58 169 Q52 177 46 166Z M155 115 Q163 107 171 116 L174 166 Q168 177 162 169Z"/>
      <Zone name="Back" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M72 101 Q90 91 108 102 L105 177 Q88 191 72 172Z M112 102 Q131 91 148 101 L148 172 Q132 191 115 177Z"/>
      <Zone name="Glutes" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M69 208 Q89 198 108 210 L107 253 Q89 263 68 247Z M112 210 Q131 198 151 208 L152 247 Q131 263 113 253Z"/>
      <Zone name="Hamstrings" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M68 255 Q88 264 106 257 L99 329 81 340 68 321Z M114 257 Q132 264 152 255 L152 321 139 340 121 329Z"/>
      <Zone name="Calves" selectedMuscle={selectedMuscle} onSelect={onSelect} d="M73 337 L85 332 92 367 82 399 Q73 406 67 397Z M135 332 L147 337 153 397 Q147 406 138 399 L128 367Z"/>
    </g>
    <g className="banana-anatomy-detail"><path d="M110 64V205 M72 138Q110 160 148 138 M77 180Q110 198 143 180 M68 203Q110 190 152 203 M110 257V328 M81 285Q94 295 103 285 M117 285Q128 295 140 285"/></g>
    <text className="banana-view-label" x="110" y="426">BACK</text>
  </svg>;
}

export default function BodyDiagram({ selectedMuscle, onSelect }: Props) {
  return <section className="banana-anatomy" aria-label="Interactive muscle map">
    <div className="banana-anatomy-heading"><span>ANATOMY MAP</span><span>TAP A MUSCLE TO VIEW ITS RANK</span></div>
    <div className="banana-anatomy-views"><div className="banana-anatomy-view"><Front selectedMuscle={selectedMuscle} onSelect={onSelect}/></div><div className="banana-anatomy-view"><Back selectedMuscle={selectedMuscle} onSelect={onSelect}/></div></div>
    <div className="banana-anatomy-legend"><i/> SELECTED MUSCLE <span>•</span> TAP ANY HIGHLIGHTED REGION</div>
    <div className="banana-anatomy-chips">{muscles.map((muscle) => <button type="button" key={muscle} className={selectedMuscle === muscle ? "active" : ""} aria-pressed={selectedMuscle === muscle} onClick={() => onSelect(muscle)}>{muscle}</button>)}</div>
  </section>;
}
