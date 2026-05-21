import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Editor } from '@tiptap/react';

interface ActiveEditorContextType {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
}

const ActiveEditorContext = createContext<ActiveEditorContextType>({
  editor: null,
  setEditor: () => {},
});

export const useActiveEditor = () => useContext(ActiveEditorContext);

export const ActiveEditorProvider = ({ children }: { children: ReactNode }) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <ActiveEditorContext.Provider value={{ editor, setEditor }}>
      {children}
    </ActiveEditorContext.Provider>
  );
};
