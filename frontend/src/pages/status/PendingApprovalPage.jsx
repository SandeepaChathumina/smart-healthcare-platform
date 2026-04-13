import { Link } from 'react-router-dom';
import StatusCard from '../../components/common/StatusCard';
import { APP_ROUTES } from '../../constants/routes';

const PendingApprovalPage = () => {
  return (
    <StatusCard
      title="Doctor Approval Pending"
      description="Your email has been verified, but your doctor account is still waiting for admin approval. You will be able to access the doctor dashboard after approval."
    >
      <Link
        to={APP_ROUTES.HOME}
        className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Back to Home
      </Link>
    </StatusCard>
  );
};

export default PendingApprovalPage;