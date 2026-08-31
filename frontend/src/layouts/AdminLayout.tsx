import { Outlet } from 'react-router-dom'
import { Container } from '../components/ui/Container'

export function AdminLayout() { return <Container><header>Private administration foundation</header><main><Outlet /></main></Container> }
