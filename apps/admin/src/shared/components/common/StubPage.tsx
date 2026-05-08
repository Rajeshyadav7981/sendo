import { PageContainer } from './PageContainer';

interface Props {
  title: string;
  legacyPath?: string;
}

/**
 * Placeholder used by routes whose UI hasn't been ported yet from the legacy
 * `sendo-ui` repo. The matching API endpoint is already wired in
 * `features/<area>/*.api.ts` — paste the legacy JSX into the corresponding
 * page file and replace this stub.
 */
export function StubPage({ title, legacyPath }: Props): JSX.Element {
  return (
    <PageContainer title={title}>
      <div className="space-y-2">
        <p>This screen is set up but not yet ported from the legacy code.</p>
        {legacyPath && (
          <p className="text-sm text-gray-500">
            Source: <code>{legacyPath}</code>
          </p>
        )}
      </div>
    </PageContainer>
  );
}
