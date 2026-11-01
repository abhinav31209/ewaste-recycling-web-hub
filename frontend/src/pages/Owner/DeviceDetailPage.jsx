import { Navigate, useLocation, useParams } from "react-router-dom";

export default function DeviceDetailPage() {
  const { id } = useParams();
  const location = useLocation();

  return (
    <Navigate
      to={`/devices/${id}/result`}
      replace
      state={location.state}
    />
  );
}
