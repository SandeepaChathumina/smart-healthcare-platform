import { Link } from 'react-router-dom';
import StatusCard from '../../components/common/StatusCard';
import { APP_ROUTES } from '../../constants/routes';

const AccountBlockedPage = () => {
  return (
    <StatusCard
      title="Account Restricted"
      description="Your account is currently not allowed to access the system. This may be because the account is suspended or rejected. Please contact support or an administrator."
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

export default AccountBlockedPage;