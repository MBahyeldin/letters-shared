import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { useLettersStore } from '../../store/lettersStore';
import LetterCard from './LetterCard';

export default function LetterList() {
  const letters = useLettersStore((s) => s.letters);
  const reorderLetters = useLettersStore((s) => s.reorderLetters);
  const isLoading = useLettersStore((s) => s.isLoading);
  const error = useLettersStore((s) => s.error);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = letters.findIndex((l) => l.id === active.id);
    const newIndex = letters.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(letters, oldIndex, newIndex);
    reorderLetters(reordered.map((l) => l.id));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl h-36 animate-pulse"
            style={{ opacity: 1 - i * 0.25 }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (letters.length === 0) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="3" stroke="#B3B3BF" strokeWidth="1.5" />
            <path d="M9 10h10M9 14h7M9 18h5" stroke="#B3B3BF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="font-serif text-xl font-medium text-ink-500 mb-2">No letters yet</h3>
        <p className="text-sm text-ink-400">Click the + button to write your first letter.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={letters.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {letters.map((letter) => (
            <LetterCard key={letter.id} letter={letter} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
