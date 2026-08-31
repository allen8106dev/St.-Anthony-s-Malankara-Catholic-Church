import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
export function PlaceholderPage({ area }: { area: string }) { return <Container><section className="placeholder-page" aria-label={`${area} placeholder`}><p className="eyebrow">Coming soon</p><h1 className="heading">{area}</h1><p className="lede">This page is prepared for future parish content. No live church information has been added yet.</p><Link className="button button--primary" to="/">Return home</Link></section></Container> }
