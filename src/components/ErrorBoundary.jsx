import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { err: null }
  }

  static getDerivedStateFromError(err) {
    return { err }
  }

  render() {
    if (!this.state.err) return this.props.children
    return (
      <section className="section paper" style={{ padding: '48px 24px' }}>
        <p className="kicker">This panel failed to render</p>
        <p style={{ marginTop: 12, color: '#5a5e56', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.85rem' }}>
          {String(this.state.err.message || this.state.err)}
        </p>
      </section>
    )
  }
}
