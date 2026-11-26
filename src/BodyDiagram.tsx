import type { KeyboardEvent } from "react";

type Props = { selectedMuscle: string; onSelect: (muscle: string) => void };

const groups = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Legs"];

export default function BodyDiagram({ selectedMuscle, onSelect }: Props) {
  const choose = (muscle: string) => onSelect(muscle);
  const keyChoose = (event: KeyboardEvent<SVGGElement>, muscle: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(muscle);
    }
  };
  const zone = (muscle: string, path: string, label: string) => (
    <g
      key={label}
      className={selectedMuscle === muscle ? "body-zone selected" : "body-zone"}
      role="button"
      tabIndex={0}
      aria-label={"Select " + muscle}
      aria-pressed={selectedMuscle === muscle}
      onClick={() => choose(muscle)}
      onKeyDown={(event) => keyChoose(event, muscle)}
    >
      <title>{muscle}</title>
      <path d={path} />
    </g>
  );

  return (
    <div className="body-diagram-wrap">
      <div className="body-diagram-legend"><span>FRONT VIEW</span><span>BACK VIEW</span></div>
      <svg className="body-diagram" viewBox="0 0 560 330" role="group" aria-label="Interactive front and back body muscle diagram">
        <defs>
          <linearGradient id="bodyBase" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#243642" />
            <stop offset="1" stopColor="#14232D" />
          </linearGradient>
        </defs>
        <g className="body-base" fill="url(#bodyBase)" stroke="#526773" strokeWidth="1.5" strokeLinejoin="round">
          <circle cx="145" cy="34" r="22" /><path d="M126 60 Q112 62 96 73 L72 83 Q61 90 64 106 L79 151 L91 147 L84 107 L101 101 L103 164 L94 219 L103 298 L124 298 L139 224 L145 180 L151 224 L166 298 L187 298 L196 219 L187 164 L189 101 L206 107 L199 147 L211 151 L226 106 Q229 90 218 83 L194 73 Q178 62 164 60Z" />
          <circle cx="415" cy="34" r="22" /><path d="M396 60 Q382 62 366 73 L342 83 Q331 90 334 106 L349 151 L361 147 L354 107 L371 101 L373 164 L364 219 L373 298 L394 298 L409 224 L415 180 L421 224 L436 298 L457 298 L466 219 L457 164 L459 101 L476 107 L469 147 L481 151 L496 106 Q499 90 488 83 L464 73 Q448 62 434 60Z" />
        </g>
        <g className="body-zones">
          {zone("Shoulders", "M99 76 Q112 65 129 68 L139 86 L121 103 L91 101Z", "front-left-shoulder")}
          {zone("Shoulders", "M161 68 Q178 65 191 76 L199 101 L169 103 L151 86Z", "front-right-shoulder")}
          {zone("Chest", "M126 83 Q144 75 145 93 L143 126 Q126 131 109 112Z", "front-left-chest")}
          {zone("Chest", "M145 93 Q146 75 164 83 L181 112 Q164 131 147 126Z", "front-right-chest")}
          {zone("Biceps", "M88 104 L106 103 L119 139 L107 157 L92 143Z", "front-left-bicep")}
          {zone("Biceps", "M184 103 L202 104 L198 143 L183 157 L171 139Z", "front-right-bicep")}
          {zone("Triceps", "M349 103 L367 103 L379 141 L365 156 L350 141Z", "back-left-tricep")}
          {zone("Triceps", "M463 103 L481 103 L479 141 L465 156 L451 141Z", "back-right-tricep")}
          {zone("Back", "M383 77 Q414 63 447 77 L453 125 Q432 145 415 132 Q398 145 377 125Z", "back-muscles")}
          {zone("Core", "M127 130 Q145 135 163 130 L170 187 L145 198 L120 187Z", "front-core")}
          {zone("Legs", "M111 196 L143 198 L133 261 L121 286 L104 286 L102 240Z", "front-left-leg")}
          {zone("Legs", "M147 198 L179 196 L188 240 L186 286 L169 286 L157 261Z", "front-right-leg")}
          {zone("Legs", "M381 196 L413 198 L403 261 L391 286 L374 286 L372 240Z", "back-left-leg")}
          {zone("Legs", "M417 198 L449 196 L458 240 L456 286 L439 286 L427 261Z", "back-right-leg")}
        </g>
        <g className="body-diagram-labels" fill="currentColor" fontSize="10" textAnchor="middle">
          <text x="145" y="320">FRONT</text><text x="415" y="320">BACK</text>
        </g>
      </svg>
      <div className="body-muscle-chips">
        {groups.map((muscle) => <button key={muscle} type="button" className={selectedMuscle === muscle ? "body-muscle-chip selected" : "body-muscle-chip"} onClick={() => choose(muscle)}>{muscle}</button>)}
      </div>
    </div>
  );
}
