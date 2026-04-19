import { useNavigate } from 'react-router-dom';
import { Archive } from 'lucide-react';
import PageHero from '../components/Layout/PageHero';
import HistoryList from '../components/Dashboard/HistoryList';

export default function HistoryPage({ onSelectDashboard, onDeleteDashboard }) {
  const navigate = useNavigate();

  const handleSelect = async (item) => {
    // This calls loadFromHistory from App.jsx
    await onSelectDashboard(item);
    navigate('/');
  };

  return (
    <div className="fade-in">
      <PageHero 
        title="Saved Dashboards"
        description="View, manage, and reload your previously saved dashboard layouts securely stored in the cloud."
        icon={Archive}
      />
      
      <HistoryList onSelectDashboard={handleSelect} onDeleteDashboard={onDeleteDashboard} />
    </div>
  );
}
