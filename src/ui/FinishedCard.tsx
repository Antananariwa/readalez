// The Finished card (SPEC.md feature 7), after the last word. Reading time
// and average speed join it with reading sessions (#20).

interface Props {
  words: number;
  onBack: () => void;
  onStartOver: () => void;
}

const count = new Intl.NumberFormat("en");

export default function FinishedCard({ words, onBack, onStartOver }: Props) {
  return (
    <section className="finished" aria-labelledby="finished-title">
      <h2 id="finished-title">Finished</h2>
      <p data-testid="word-count">
        {count.format(words)} {words === 1 ? "word" : "words"}
      </p>
      <div className="finished-actions">
        <button type="button" onClick={onBack}>
          Back to library
        </button>
        <button type="button" onClick={onStartOver}>
          Start over
        </button>
      </div>
    </section>
  );
}
