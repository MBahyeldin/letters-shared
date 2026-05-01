import {
  EditorProvider,
  PortableTextEditable,
  defineSchema,
  useEditor,
  useEditorSelector,
} from '@portabletext/editor';
import type {
  PortableTextBlock,
  RenderDecoratorFunction,
  RenderStyleFunction,
  RenderBlockFunction,
  RenderListItemFunction,
} from '@portabletext/editor';
import { EventListenerPlugin } from '@portabletext/editor/plugins';
import {
  isActiveDecorator,
  isActiveStyle,
  isActiveListItem,
} from '@portabletext/editor/selectors';
import { useMemo, useCallback } from 'react';
import { clsx } from 'clsx';

interface RichTextEditorProps {
  content: PortableTextBlock[];
  onChange: (value: PortableTextBlock[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

interface FormatButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function FormatButton({ active, onClick, title, children, disabled }: FormatButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'px-2 py-1 text-xs font-medium rounded transition-colors duration-100',
        disabled && 'opacity-50 cursor-not-allowed',
        active
          ? 'bg-ink-900 text-white'
          : 'text-ink-600 hover:bg-ink-100'
      )}
    >
      {children}
    </button>
  );
}

// Schema definition for Portable Text
const schemaDefinition = defineSchema({
  decorators: [
    { name: 'strong' },
    { name: 'em' },
    { name: 'underline' },
    { name: 'code' },
  ],
  styles: [
    { name: 'normal' },
    { name: 'h1' },
    { name: 'h2' },
    { name: 'h3' },
    { name: 'blockquote' },
  ],
  lists: [{ name: 'bullet' }, { name: 'number' }],
  annotations: [],
  inlineObjects: [],
  blockObjects: [],
});

const renderStyle: RenderStyleFunction = (props) => {
  const style = props.schemaType.name;
  switch (style) {
    case 'h1':
      return <h1 className="text-2xl font-bold mt-4 mb-2">{props.children}</h1>;
    case 'h2':
      return <h2 className="text-xl font-semibold mt-3 mb-2">{props.children}</h2>;
    case 'h3':
      return <h3 className="text-lg font-medium mt-2 mb-1">{props.children}</h3>;
    case 'blockquote':
      return <blockquote className="border-l-4 border-ink-300 pl-4 italic text-ink-600">{props.children}</blockquote>;
    default:
      return <p className="mb-2">{props.children}</p>;
  }
};

const renderDecorator: RenderDecoratorFunction = (props) => {
  switch (props.value) {
    case 'strong':
      return <strong>{props.children}</strong>;
    case 'em':
      return <em>{props.children}</em>;
    case 'underline':
      return <u>{props.children}</u>;
    case 'code':
      return <code className="bg-ink-100 px-1 rounded text-sm font-mono">{props.children}</code>;
    default:
      return <>{props.children}</>;
  }
};

const renderBlock: RenderBlockFunction = (props) => {
  return <div>{props.children}</div>;
};

const renderListItem: RenderListItemFunction = (props) => {
  return <li className="ml-4">{props.children}</li>;
};

function Toolbar() {
  const editor = useEditor();

  const isStrongActive = useEditorSelector(editor, isActiveDecorator('strong'));
  const isEmActive = useEditorSelector(editor, isActiveDecorator('em'));
  const isUnderlineActive = useEditorSelector(editor, isActiveDecorator('underline'));
  const isCodeActive = useEditorSelector(editor, isActiveDecorator('code'));
  const isH1Active = useEditorSelector(editor, isActiveStyle('h1'));
  const isH2Active = useEditorSelector(editor, isActiveStyle('h2'));
  const isBulletActive = useEditorSelector(editor, isActiveListItem('bullet'));
  const isBlockquoteActive = useEditorSelector(editor, isActiveStyle('blockquote'));

  const toggleDecorator = useCallback((decorator: string) => {
    editor.send({ type: 'decorator.toggle', decorator });
    editor.send({ type: 'focus' });
  }, [editor]);

  const toggleStyle = useCallback((style: string) => {
    editor.send({ type: 'style.toggle', style });
    editor.send({ type: 'focus' });
  }, [editor]);

  const toggleList = useCallback((listItem: string) => {
    editor.send({ type: 'list item.toggle', listItem });
    editor.send({ type: 'focus' });
  }, [editor]);

  return (
    <div className="flex items-center gap-1 bg-white border border-ink-200 rounded-xl shadow-card px-2 py-1 mb-2">
      <FormatButton active={isStrongActive} onClick={() => toggleDecorator('strong')} title="Bold">
        <strong>B</strong>
      </FormatButton>
      <FormatButton active={isEmActive} onClick={() => toggleDecorator('em')} title="Italic">
        <em>I</em>
      </FormatButton>
      <FormatButton active={isUnderlineActive} onClick={() => toggleDecorator('underline')} title="Underline">
        <u>U</u>
      </FormatButton>
      <div className="w-px h-4 bg-ink-200 mx-0.5" />
      <FormatButton active={isH1Active} onClick={() => toggleStyle('h1')} title="Heading 1">
        H1
      </FormatButton>
      <FormatButton active={isH2Active} onClick={() => toggleStyle('h2')} title="Heading 2">
        H2
      </FormatButton>
      <div className="w-px h-4 bg-ink-200 mx-0.5" />
      <FormatButton active={isBulletActive} onClick={() => toggleList('bullet')} title="Bullet list">
        •—
      </FormatButton>
      <FormatButton active={isBlockquoteActive} onClick={() => toggleStyle('blockquote')} title="Blockquote">
        "
      </FormatButton>
      <FormatButton active={isCodeActive} onClick={() => toggleDecorator('code')} title="Inline code">
        {'</>'}
      </FormatButton>
    </div>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your letter here…',
  readOnly = false,
  className,
}: RichTextEditorProps) {
  const initialValue = useMemo(() => {
    return content.length > 0 ? content : undefined;
  }, [content]);

  const charCount = useMemo(() => {
    return content.reduce((count: number, block: PortableTextBlock) => {
      if (block._type === 'block' && Array.isArray((block as Record<string, unknown>).children)) {
        const children = (block as Record<string, unknown>).children as Array<{ text?: string }>;
        return count + children.reduce((childCount: number, child) => {
          return childCount + (typeof child.text === 'string' ? child.text.length : 0);
        }, 0);
      }
      return count;
    }, 0);
  }, [content]);

  const handleEvent = useCallback((event: { type: string; value?: PortableTextBlock[] }) => {
    if (event.type === 'mutation' && event.value) {
      onChange(event.value);
    }
  }, [onChange]);

  return (
    <div className={clsx('relative', className)}>
      <EditorProvider
        initialConfig={{
          schemaDefinition,
          initialValue,
          readOnly,
        }}
      >
        <EventListenerPlugin on={handleEvent} />

        {!readOnly && <Toolbar />}

        <div className={clsx(!readOnly && 'min-h-[240px]')}>
          <PortableTextEditable
            renderStyle={renderStyle}
            renderDecorator={renderDecorator}
            renderBlock={renderBlock}
            renderListItem={renderListItem}
            className="tiptap-content focus:outline-none"
            data-placeholder={placeholder}
          />
        </div>
      </EditorProvider>

      {!readOnly && (
        <div className="mt-2 text-right text-xs text-ink-400">
          {charCount.toLocaleString()} characters
        </div>
      )}
    </div>
  );
}
