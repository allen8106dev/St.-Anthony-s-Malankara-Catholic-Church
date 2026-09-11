import { demoImages } from '../../data/siteContent'
import { PageLayout } from '../../components/public/PageLayout'

export function DonatePage() {
  return (
    <PageLayout
      eyebrow="Give"
      title="Support what matters."
      intro="This is a visual demonstration only. No payments, personal financial details, or payment processing are collected in this phase."
      image={demoImages.hands}
    >
      <section className="section">
        <div className="container donate-grid">
          <div>
            <p className="eyebrow">Why give</p>
            <h2 className="heading heading--small">A future place for generosity.</h2>
            <p className="lede">
              The parish will be able to explain real giving opportunities here once categories and payment details are confirmed.
            </p>
          </div>
          <form className="donate-form" onSubmit={(event) => event.preventDefault()}>
            <p className="eyebrow">Demo interface — non-functional</p>
            <fieldset>
              <legend>Choose an amount</legend>
              <div className="amounts">
                {['25', '50', '100', '250'].map((amount) => (
                  <button type="button" key={amount}>
                    ₹{amount}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              Custom amount
              <input inputMode="decimal" placeholder="Enter amount" />
            </label>
            <label>
              Purpose
              <select defaultValue="General Fund">
                <option>General Fund</option>
                <option>Building</option>
                <option>Missions</option>
                <option>Other</option>
              </select>
            </label>
            <button className="button button--primary" type="submit">
              Continue (demo)
            </button>
            <p className="quiet">Secure payment details will be added only in a future payment phase.</p>
          </form>
        </div>
      </section>
    </PageLayout>
  )
}

