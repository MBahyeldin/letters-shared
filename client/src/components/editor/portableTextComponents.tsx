import type { PortableTextComponents } from '@portabletext/react';
import type {
  RenderDecoratorFunction,
  RenderStyleFunction,
  RenderBlockFunction,
  RenderListItemFunction,
} from '@portabletext/editor';

// Shared styles
const styles = {
  h1: 'text-2xl font-bold mt-4 mb-2 text-right',
  h2: 'text-xl font-semibold mt-3 mb-2 text-right',
  h3: 'text-lg font-medium mt-2 mb-1 text-right',
  blockquote: 'border-l-4 border-ink-300 pl-4 italic text-ink-600 text-right',
  p: 'mb-2 text-right',
  strike: 'text-ink-400',
  highlight: 'bg-yellow-200 px-0.5 rounded',
  code: 'bg-ink-100 px-1 rounded text-sm font-mono',
  bulletList: 'list-disc ml-6 ',
  numberList: 'list-decimal ml-6 ',
  listItem: 'ml-4',
};

// For @portabletext/react (preview)
export const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className={styles.p}>{children}</p>,
    h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
    h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
    h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
    blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    underline: ({ children }) => <u>{children}</u>,
    strike: ({ children }) => <s className={styles.strike}>{children}</s>,
    highlight: ({ children }) => <mark className={styles.highlight}>{children}</mark>,
    code: ({ children }) => <code className={styles.code}>{children}</code>,
  },
  list: {
    bullet: ({ children }) => <ul className={styles.bulletList}>{children}</ul>,
    number: ({ children }) => <ol className={styles.numberList}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
};

// For @portabletext/editor (editor)
export const renderStyle: RenderStyleFunction = (props) => {
  const style = props.schemaType.name;
  switch (style) {
    case 'h1':
      return <h1 className={styles.h1}>{props.children}</h1>;
    case 'h2':
      return <h2 className={styles.h2}>{props.children}</h2>;
    case 'h3':
      return <h3 className={styles.h3}>{props.children}</h3>;
    case 'blockquote':
      return <blockquote className={styles.blockquote}>{props.children}</blockquote>;
    default:
      return <p className={styles.p}>{props.children}</p>;
  }
};

export const renderDecorator: RenderDecoratorFunction = (props) => {
  switch (props.value) {
    case 'strong':
      return <strong>{props.children}</strong>;
    case 'em':
      return <em>{props.children}</em>;
    case 'underline':
      return <u>{props.children}</u>;
    case 'strike':
      return <s className={styles.strike}>{props.children}</s>;
    case 'highlight':
      return <mark className={styles.highlight}>{props.children}</mark>;
    case 'code':
      return <code className={styles.code}>{props.children}</code>;
    default:
      return <>{props.children}</>;
  }
};

export const renderBlock: RenderBlockFunction = (props) => {
  return <div>{props.children}</div>;
};

export const renderListItem: RenderListItemFunction = (props) => {
  return <li className={styles.listItem}>{props.children}</li>;
};
