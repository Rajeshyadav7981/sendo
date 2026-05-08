interface Props {
  title: string;
  legacyPath?: string;
}

export function StubPage({ title, legacyPath }: Props): JSX.Element {
  return (
    <div className="space-y-2">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm text-gray-600">
        Screen scaffolded — port the UI from the legacy file when ready.
      </p>
      {legacyPath && <p className="text-xs text-gray-500">Source: <code>{legacyPath}</code></p>}
    </div>
  );
}
