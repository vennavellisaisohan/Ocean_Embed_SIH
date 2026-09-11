export function SectionHead({ index, title, italic, kicker, children }) {
  return (
    <header className="section-head">
      <div>
        <div className="section-idx">{index}</div>
        {kicker && <p className="kicker" style={{ marginTop: 10 }}>{kicker}</p>}
      </div>
      <div>
        <h2>
          {title}{italic ? <> <em>{italic}</em></> : null}
        </h2>
        {children}
      </div>
    </header>
  )
}

export function Tip({ dark, children }) {
  return <div className={`tip${dark ? ' dark' : ''}`}>{children}</div>
}
