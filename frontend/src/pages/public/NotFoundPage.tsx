import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="not-found">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className="display">This path leads somewhere else.</h1>
        <p className="lede">The page you are looking for is not available.</p>
        <Link className="button button--primary" to="/">
          Return home
        </Link>
      </div>
    </section>
  )
}
