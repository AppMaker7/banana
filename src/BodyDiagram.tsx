type Props = { selectedMuscle: string; onSelect: (muscle: string) => void };

const groups = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Glutes", "Legs"];

function Figure({ back }: { back: boolean }) {
  return (
    <svg viewBox="0 0 180 360" role="img" aria-label={back ? "Back view body silhouette" : "Front view body silhouette"} className="fitness-figure">
      <g fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M76 49 C65 50 54 54 45 61 C39 66 36 77 33 91 L21 132 C18 142 21 151 27 153 C33 155 38 149 41 140 L53 104 L56 151 C57 165 55 178 51 191 C48 203 51 214 60 220 L66 224 L62 270 L54 326 C53 335 58 341 65 341 C72 341 75 336 77 327 L89 268 L91 268 L103 327 C105 336 108 341 115 341 C122 341 127 335 126 326 L118 270 L114 224 L120 220 C129 214 132 203 129 191 C125 178 123 165 124 151 L127 104 L139 140 C142 149 147 155 153 153 C159 151 162 142 159 132 L147 91 C144 77 141 66 135 61 C126 54 115 50 104 49 L99 44 L81 44 Z" />
        <path d="M81 44 C81 51 79 55 75 59 M99 44 C99 51 101 55 105 59" />
        <path d="M60 220 C69 227 78 230 90 230 C102 230 111 227 120 220" opacity=".35" />
        <path d="M90 60 L90 218" opacity=".22" />
        {back ? (
          <path d="M53 104 C65 111 77 115 90 115 C103 115 115 111 127 104" opacity=".28" />
        ) : (
          <path d="M54 104 C66 111 78 115 90 115 C102 115 114 111 126 104" opacity=".28" />
        )}
      </g>
      <circle cx="90" cy="26" r="18" fill="none" stroke="#FFFFFF" strokeWidth="2.4" />
      <text x="90" y="357" textAnchor="middle" fill="#FFFFFF" opacity=".62" fontSize="8" fontWeight="700" letterSpacing="1.8">{back ? "BACK" : "FRONT"}</text>
    </svg>
  );
}

export default function BodyDiagram({ selectedMuscle, onSelect }: Props) {
  return (
    <div className="bodygraph-pro anatomy-reference">
      <div className="fitness-figures">
        <Figure back={false} />
        <Figure back />
      </div>
      <div className="anatomy-reference-caption">
        <span>BODY MAP</span>
        <span>SELECT A MUSCLE GROUP BELOW</span>
      </div>
      <div className="anatomy-muscle-select" aria-label="Select muscle group">
        {groups.map((muscle) => (
          <button
            type="button"
            key={muscle}
            className={selectedMuscle === muscle ? "anatomy-muscle-button active" : "anatomy-muscle-button"}
            aria-pressed={selectedMuscle === muscle}
            onClick={() => onSelect(muscle)}
          >
            {muscle}
          </button>
        ))}
      </div>
    </div>
  );
}
