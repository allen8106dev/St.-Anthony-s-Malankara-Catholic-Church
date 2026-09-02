import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFamilies } from '../../hooks/useMembers'
import { Pagination, SkeletonRows } from '../../components/admin/AdminShared'

export function FamiliesPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') ?? '1', 10)
  const search = params.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError } = useFamilies({ page, page_size: 25, search })

  useEffect(() => {
    const t = setTimeout(() => {
      setParams((p) => {
        const n = new URLSearchParams(p)
        if (searchInput) n.set('search', searchInput); else n.delete('search')
        n.set('page', '1')
        return n
      })
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const setPage = useCallback((p: number) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n }), [setParams])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Families</h1>
          <p>Manage church family units</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/members" className="button button--outline">Members</Link>
          <Link to="/admin/families/new" className="button button--primary">+ Add Family</Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            type="search" placeholder="Search families…"
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search families"
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table" aria-label="Families">
          <thead>
            <tr>
              <th scope="col">Family name</th>
              <th scope="col">Address</th>
              <th scope="col">Members</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonRows rows={4} />}
            {isError && (
              <tr><td colSpan={4}><p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>Failed to load families.</p></td></tr>
            )}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr><td colSpan={4}>
                <div className="admin-empty">
                  <p style={{ fontWeight: 600 }}>No families found.</p>
                  <p>Try changing your search or add a new family.</p>
                </div>
              </td></tr>
            )}
            {data?.items.map((f) => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{f.family_name}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.88rem' }}>{f.address ?? '—'}</td>
                <td>{f.member_count}</td>
                <td>
                  <div className="actions">
                    <Link to={`/admin/families/${f.id}`} className="button button--ghost" style={{ fontSize: '.82rem' }}>View</Link>
                    <Link to={`/admin/families/${f.id}/edit`} className="button button--ghost" style={{ fontSize: '.82rem' }}>Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="member-card-grid">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="member-card"><div className="admin-skeleton" style={{ height: '4rem' }} /></div>
        ))}
        {data?.items.map((f) => (
          <div key={f.id} className="member-card">
            <div className="member-card__name">{f.family_name}</div>
            {f.address && <div className="member-card__meta">{f.address}</div>}
            <div className="member-card__meta">{f.member_count} member{f.member_count !== 1 ? 's' : ''}</div>
            <div className="member-card__actions">
              <Link to={`/admin/families/${f.id}`} className="button button--outline" style={{ fontSize: '.82rem' }}>View</Link>
              <Link to={`/admin/families/${f.id}/edit`} className="button button--ghost" style={{ fontSize: '.82rem' }}>Edit</Link>
            </div>
          </div>
        ))}
      </div>

      {data && data.pages > 1 && (
        <Pagination page={data.page} pages={data.pages} total={data.total} pageSize={data.page_size} onPage={setPage} />
      )}
    </div>
  )
}
