type Props = { selectedMuscle: string; onSelect: (muscle: string) => void };

const groups = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Legs"];

function Figure({ back }: { back: boolean }) {
  return (
    <svg viewBox="0 0 150 260" role="img" aria-label={back ? "Back view body outline" : "Front view body outline"} className="fitness-figure">
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="75" cy="23" r="14" />
        <path d="M68 38 L68 45 M82 38 L82 45" />
        <path d="M67 44 Q57 45 48 49 Q40 52 37 62 L29 91 Q27 99 34 101 Q40 102 43 94 L51 72 L54 112 Q75 119 96 112 L99 72 L107 94 Q110 102 116 101 Q123 99 121 91 L113 62 Q110 52 102 49 Q93 45 83 44" />
        <path d="M54 112 Q51 128 53 143 Q75 151 97 143 Q99 128 96 112" />
        <path d="M57 144 Q56 166 57 190 L54 234 Q53 243 59 245 Q65 246 67 238 L73 199 L75 149" />
        <path d="M75 149 L77 199 L83 238 Q85 246 91 245 Q97 243 96 234 L93 190 Q94 166 93 144" />
        <path d="M54 235 Q48 238 46 245 Q45 251 51 252 L64 252 Q68 250 67 243" />
        <path d="M83 243 Q82 250 86 252 L99 252 Q105 251 104 245 Q102 238 96 235" />
        {back ? (
          <path d="M75 47 L75 116 M53 67 Q75 77 97 67 M55 112 Q75 121 95 112" opacity=".55" />
        ) : (
          <path d="M75 47 L75 145 M54 84 Q75 91 96 84" opacity=".55" />
        )}
      </g>
      <text x="75" y="263" textAnchor="middle" fill="#FFFFFF" opacity=".65" fontSize="8" fontWeight="700" letterSpacing="1.5">{back ? "BACK" : "FRONT"}</text>
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
