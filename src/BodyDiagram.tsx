type Props = { selectedMuscle: string; onSelect: (muscle: string) => void };

const groups = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Legs"];

function Figure({ back, selected }: { back: boolean; selected: string }) {
  const active = (name: string) => selected === name;
  const skin = "#D9D5C4";
  const line = "#8F896F";
  const highlight = "#FFE44D";
  return (
    <svg viewBox="0 0 150 260" role="img" aria-label={back ? "Back view fitness figure" : "Front view fitness figure"} className="fitness-figure">
      <circle cx="75" cy="23" r="14" fill={skin} stroke={line} strokeWidth="1.5" />
      <path d="M68 37 L68 44 L82 44 L82 37" fill={skin} stroke={line} strokeWidth="1.3" />
      <path d="M57 46 Q45 46 38 55 L29 91 Q27 99 34 101 Q40 102 43 94 L51 72 L54 111 L96 111 L99 72 L107 94 Q110 102 116 101 Q123 99 121 91 L112 55 Q105 46 93 46 L84 43 L66 43 Z" fill={skin} stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M54 110 L96 110 L100 139 L91 145 L59 145 L50 139 Z" fill="#242318" stroke={line} strokeWidth="1.4" />
      <path d="M58 144 L74 144 L72 201 L66 238 Q64 245 57 244 Q51 242 54 234 L57 199 Z" fill={skin} stroke={line} strokeWidth="1.5" />
      <path d="M76 144 L92 144 L93 199 L96 234 Q99 242 92 244 Q85 245 83 238 L78 201 Z" fill={skin} stroke={line} strokeWidth="1.5" />
      <path d="M53 235 Q59 239 66 237 L65 247 Q60 252 46 251 Q42 248 48 243 Z M84 237 Q91 239 97 235 L102 243 Q108 248 103 251 L88 251 Q82 250 84 244 Z" fill="#242318" stroke={line} strokeWidth="1.3" />
      {back ? (
        <>
          <path d="M54 53 Q75 43 96 53 L91 87 Q75 99 59 87 Z" fill={active("Back") ? highlight : "#B9B39D"} opacity={active("Back") ? 0.95 : 0.55} stroke={line} strokeWidth="1" />
          <path d="M58 54 Q48 52 43 61 L37 89 Q42 94 47 87 L55 69 M92 54 Q102 52 107 61 L113 89 Q108 94 103 87 L95 69" fill={active("Shoulders") ? highlight : "none"} stroke={line} strokeWidth="1.2" />
          <path d="M42 64 Q35 68 34 83 L31 94 Q38 98 42 90 L48 72 M108 64 Q115 68 116 83 L119 94 Q112 98 108 90 L102 72" fill={active("Biceps") || active("Triceps") ? highlight : "#B9B39D"} opacity=".7" stroke={line} strokeWidth="1" />
          <path d="M60 92 Q75 99 90 92 L88 130 L62 130 Z" fill={active("Core") ? highlight : "#B9B39D"} opacity=".65" stroke={line} strokeWidth="1" />
          <path d="M57 148 Q65 151 72 148 L70 190 L59 190 Z M78 148 Q85 151 93 148 L91 190 L80 190 Z" fill={active("Legs") ? highlight : "#B9B39D"} opacity=".65" stroke={line} strokeWidth="1" />
        </>
      ) : (
        <>
          <path d="M53 53 Q63 47 74 53 L73 83 Q62 91 53 80 Z M76 53 Q87 47 97 53 L97 80 Q87 91 77 83 Z" fill={active("Chest") ? highlight : "#B9B39D"} opacity={active("Chest") ? 0.95 : 0.55} stroke={line} strokeWidth="1" />
          <path d="M53 48 Q44 48 40 59 L47 74 L56 65 M97 48 Q106 48 110 59 L103 74 L94 65" fill={active("Shoulders") ? highlight : "#B9B39D"} opacity=".8" stroke={line} strokeWidth="1" />
          <path d="M40 64 L34 88 Q36 95 42 91 L50 68 M110 64 L116 88 Q114 95 108 91 L100 68" fill={active("Biceps") ? highlight : "#B9B39D"} opacity=".7" stroke={line} strokeWidth="1" />
          <path d="M50 84 Q75 92 100 84 L94 132 Q75 139 56 132 Z" fill={active("Core") ? highlight : "#B9B39D"} opacity=".65" stroke={line} strokeWidth="1" />
          <path d="M57 148 Q65 151 72 148 L70 190 L59 190 Z M78 148 Q85 151 93 148 L91 190 L80 190 Z" fill={active("Legs") ? highlight : "#B9B39D"} opacity=".65" stroke={line} strokeWidth="1" />
        </>
      )}
      <path d="M75 46 L75 137" stroke={line} strokeWidth="1" opacity=".45" />
      <path d="M52 111 L98 111" stroke={line} strokeWidth="1" opacity=".4" />
      <text x="75" y="260" textAnchor="middle" fill="#A99F69" fontSize="8" fontWeight="700" letterSpacing="1.5">{back ? "BACK" : "FRONT"}</text>
    </svg>
  );
}

export default function BodyDiagram({ selectedMuscle, onSelect }: Props) {
  return (
    <div className="bodygraph-pro anatomy-reference">
      <div className="fitness-figures">
        <Figure back={false} selected={selectedMuscle} />
        <Figure back selected={selectedMuscle} />
      </div>
      <div className="anatomy-reference-caption">
        <span>SELECT A MUSCLE GROUP</span>
        <span>HIGHLIGHTED IN YELLOW</span>
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
