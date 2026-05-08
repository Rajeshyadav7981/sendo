interface Props {
  meta?: string;
}

export function EmployeeNavbar({ meta }: Props): JSX.Element {
  return (
    <header className="sup-dash-header">
      <div className="sup-dash-header-inner">
        <div>
          <h1 className="sup-dash-title">Fleet Dashboard</h1>
          <p className="sup-dash-meta">{meta}</p>
        </div>
      </div>
    </header>
  );
}
