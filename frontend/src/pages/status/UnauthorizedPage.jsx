import { Link } from 'react-router-dom';
import StatusCard from '../../components/common/StatusCard';
import { APP_ROUTES } from '../../constants/routes';

const UnauthorizedPage = () => {
  return (
    <StatusCard
      title="Unauthorized Access"
      description="You do not have permission to access this page with your current account."
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

export default UnauthorizedPage;