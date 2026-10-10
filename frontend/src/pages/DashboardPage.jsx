import { useState, useEffect } from 'react';
import { PageLoader, ErrorState, EmptyState } from '../components/ui/UIComponents';
import { LayoutDashboard, Cpu, Activity, AlertTriangle, Wrench, TrendingUp, Zap } from 'lucide-react';
import DashboardKpiCard from '../components/dashboard/DashboardKpiCard';
import HealthTrendChart from '../components/dashboard/HealthTrendChart';
import RiskTrendChart from '../components/dashboard/RiskTrendChart';
import SensorTrendChart from '../components/dashboard/SensorTrendChart';
import ScatterChartComponent from '../components/dashboard/ScatterChart';
import MachineHealthChart from '../components/dashboard/MachineHealthChart';
import MaintenanceCostChart from '../components/dashboard/MaintenanceCostChart';
import RecentPredictions from '../components/dashboard/RecentPredictions';
import CriticalMachines from '../components/dashboard/CriticalMachines';
import RecentAlerts from '../components/dashboard/RecentAlerts';
import { dashboardService, machineService, alertService } from '../services/api';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all dashboard data in parallel
      const [dashboardRes, machinesRes, alertsRes] = await Promise.all([
        dashboardService.getAll().catch(err => {
          console.error('Dashboard API error:', err);
          return null;
        }),
        machineService.list({ limit: 20 }).catch(err => {
          console.error('Machines API error:', err);
          return { data: [] };
        }),
        alertService.list({ limit: 10 }).catch(err => {
          console.error('Alerts API error:', err);
          return { data: [] };
        }),
      ]);

      if (dashboardRes) {
        setDashboardData(dashboardRes.data);
      }
      if (machinesRes) {
        setMachines(machinesRes.data || []);
      }
      if (alertsRes) {
        setAlerts(alertsRes.data || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageLoader message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={loadDashboardData} />
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const healthTrend = dashboardData?.health_trend || dashboardData?.healthTrend;
  const riskDistribution = dashboardData?.risk_distribution || dashboardData?.riskDistribution;
  const sensorTrends = dashboardData?.sensor_trends || dashboardData?.sensorTrends;
  const scatterPoints = dashboardData?.scatter_points || dashboardData?.scatterPoints;
  const machineComparison = dashboardData?.machine_health_comparison || dashboardData?.machineHealthComparison;
  const maintenanceCost = dashboardData?.maintenance_cost_trend || dashboardData?.maintenanceCostTrend;

  // If no data at all
  if (!summary && !machines.length) {
    return (
      <div className="p-6">
        <EmptyState
          icon={LayoutDashboard}
          title="No Dashboard Data Available"
          description="Please ensure the backend is running and data has been seeded."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            AI-Powered Predictive Maintenance Overview
            {dashboardData?.is_demo_data && (
              <span className="ml-2 text-cyan-400 text-xs">(Demo Data)</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-xs">Model Version</p>
          <p className="text-slate-300 text-sm font-medium">
            {dashboardData?.model_version || dashboardData?.modelVersion || 'N/A'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <DashboardKpiCard
            title="Total Machines"
            value={summary.total_machines || summary.totalMachines || 0}
            icon={Cpu}
            color="brand"
          />
          <DashboardKpiCard
            title="Healthy"
            value={summary.healthy_machines || summary.healthyMachines || 0}
            icon={Activity}
            color="emerald"
          />
          <DashboardKpiCard
            title="Warning"
            value={summary.warning_machines || summary.warningMachines || 0}
            icon={AlertTriangle}
            color="amber"
          />
          <DashboardKpiCard
            title="Critical"
            value={summary.critical_machines || summary.criticalMachines || 0}
            icon={Zap}
            color="rose"
          />
          <DashboardKpiCard
            title="High Risk"
            value={summary.high_risk_predictions || summary.highRiskPredictions || 0}
            icon={TrendingUp}
            color="rose"
          />
          <DashboardKpiCard
            title="Avg Health"
            value={summary.average_health_score?.toFixed(1) || summary.averageHealthScore?.toFixed(1) || '0'}
            icon={Activity}
            color="cyan"
            subtitle="Score (0-100)"
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthTrendChart data={healthTrend} />
        <RiskTrendChart data={healthTrend} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SensorTrendChart data={sensorTrends} />
        <ScatterChartComponent data={scatterPoints} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MachineHealthChart data={machineComparison} />
        <MaintenanceCostChart data={maintenanceCost} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentPredictions data={healthTrend} />
        </div>
        <div className="lg:col-span-1">
          <CriticalMachines data={machines} />
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlerts data={alerts} />
      </div>
    </div>
  );
}
