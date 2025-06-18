interface EmotionSelectorProps {
  selectedEmotion: string | null;
  onEmotionSelect: (emotion: string) => void;
}

const emotions = [
  { id: 'angry', emoji: '😠', label: 'Angry', color: 'red' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'blue' },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: 'gray' },
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'green' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: 'yellow' },
  { id: 'love', emoji: '😍', label: 'Love', color: 'pink' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: 'purple' },
  { id: 'calm', emoji: '😌', label: 'Calm', color: 'cyan' },
];

export default function EmotionSelector({ selectedEmotion, onEmotionSelect }: EmotionSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {emotions.map((emotion) => (
        <button
          key={emotion.id}
          onClick={() => onEmotionSelect(emotion.id)}
          className={`emotion-btn flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
            selectedEmotion === emotion.id
              ? `emotion-${emotion.id} selected`
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-3xl mb-2">{emotion.emoji}</span>
          <span className="text-sm font-medium text-slate-700">{emotion.label}</span>
        </button>
      ))}
    </div>
  );
}
