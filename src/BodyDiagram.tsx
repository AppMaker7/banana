type Props = { selectedMuscle: string; onSelect: (muscle: string) => void };

const groups = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Legs"];

export default function BodyDiagram({ selectedMuscle, onSelect }: Props) {
  return (
    <div className="bodygraph-pro anatomy-reference">
      <div className="anatomy-reference-image">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Muscles_front_and_back.svg"
          alt="Detailed anatomical illustration of the human muscular system, showing anterior and posterior views"
          loading="eager"
        />
      </div>
      <div className="anatomy-reference-caption">
        <span>ANTERIOR / POSTERIOR MUSCLE MAP</span>
        <span>SELECT A GROUP BELOW</span>
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
      <p className="anatomy-reference-credit">
        Anatomy artwork: OpenStax / Tomáš Kebert / umimeto.org · CC BY-SA 4.0
      </p>
    </div>
  );
}
