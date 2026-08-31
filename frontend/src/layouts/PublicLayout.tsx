import { Outlet } from 'react-router-dom'
import { Container } from '../components/ui/Container'

export function PublicLayout() { return <Container><header>Public website foundation</header><main><Outlet /></main></Container> }
