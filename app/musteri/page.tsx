import CustomerPortal from '../components/portal/customer-portal'
import PortalHeader from '../components/portal/portal-header'

export default function CustomerPage() {
  return <div className="portal">
    <PortalHeader/>
    <CustomerPortal/>
  </div>
}
