import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLoader, ErrorState, EmptyState, Card, StatusBadge, HealthScoreRing, Button, Input, Select } from '../components/ui/UIComponents';
import { Search, Plus, RefreshCw, Edit, Trash2, Eye, Cpu } from 'lucide-react';
import { machineService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MachinesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [machines, setMachines] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [formData, setFormData] = useState({
    machine_code: '',
    machine_name: '',
    machine_type: '',
    location: '',
    installation_date: '',
    status: 'HEALTHY',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMachines();
  }, [search, statusFilter, typeFilter]);

  const loadMachines = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.machine_type = typeFilter;
      
      const response = await machineService.list(params);
      setMachines(response.data || []);
    } catch (err) {
      console.error('Failed to load machines:', err);
      setError('Failed to load machines. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await machineService.create(formData);
      setShowAddModal(false);
      setFormData({
        machine_code: '',
        machine_name: '',
        machine_type: '',
        location: '',
        installation_date: '',
        status: 'HEALTHY',
      });
      loadMachines();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create machine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMachine = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await machineService.update(selectedMachine.id, formData);
      setShowEditModal(false);
      setSelectedMachine(null);
      loadMachines();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to update machine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMachine = async () => {
    setSubmitting(true);
    try {
      await machineService.delete(selectedMachine.id);
      setShowDeleteModal(false);
      setSelectedMachine(null);
      loadMachines();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to delete machine');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (machine) => {
    setSelectedMachine(machine);
    setFormData({
      machine_code: machine.machine_code,
      machine_name: machine.machine_name,
      machine_type: machine.machine_type,
      location: machine.location,
      installation_date: machine.installation_date,
      status: machine.status,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (machine) => {
    setSelectedMachine(machine);
    setShowDeleteModal(true);
  };

  const canEdit = user?.role === 'admin' || user?.role === 'engineer';
  const canDelete = user?.role === 'admin';

  // Extract unique machine types from data
  const machineTypes = [...new Set(machines.map(m => m.machine_type))].sort();

  if (loading) {
    return (
      <div className="p-6">
        <PageLoader message="Loading machines..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={loadMachines} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Machines</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor machine health, sensor status and predictive maintenance risk.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddModal(true)} icon={Plus}>
            Add Machine
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by code, name, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-500" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
            <option value="OFFLINE">Offline</option>
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {machineTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          <Button variant="secondary" onClick={loadMachines} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Machines Table */}
      {machines.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No Machines Found"
          description={search || statusFilter || typeFilter ? "Try adjusting your filters or search terms." : "Get started by adding your first machine."}
          action={canEdit && !search && !statusFilter && !typeFilter && (
            <Button onClick={() => setShowAddModal(true)} icon={Plus}>Add Machine</Button>
          )}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Machine Code</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Location</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Health</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Risk</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-slate-300 font-medium">{machine.machine_code}</td>
                    <td className="py-3 px-4 text-slate-300">{machine.machine_name}</td>
                    <td className="py-3 px-4 text-slate-400">{machine.machine_type}</td>
                    <td className="py-3 px-4 text-slate-400">{machine.location}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={machine.status} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <HealthScoreRing score={machine.latest_health_score || 100} size={32} />
                        <span className="text-slate-300 text-xs">{machine.latest_health_score?.toFixed(1) || '100'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={machine.latest_risk_level || 'LOW'} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/machines/${machine.id}`)}
                          icon={Eye}
                        />
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(machine)}
                            icon={Edit}
                          />
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(machine)}
                            icon={Trash2}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Machine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Add New Machine</h2>
            <form onSubmit={handleAddMachine} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm">
                  {formError}
                </div>
              )}
              <Input
                label="Machine Code"
                value={formData.machine_code}
                onChange={(e) => setFormData({ ...formData, machine_code: e.target.value.toUpperCase() })}
                placeholder="CNC-PUMP-01"
                required
              />
              <Input
                label="Machine Name"
                value={formData.machine_name}
                onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                placeholder="Main Coolant Pump Alpha"
                required
              />
              <Input
                label="Machine Type"
                value={formData.machine_type}
                onChange={(e) => setFormData({ ...formData, machine_type: e.target.value })}
                placeholder="Centrifugal Pump"
                required
              />
              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Sector 4 - Machine Hall B"
                required
              />
              <Input
                label="Installation Date"
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                required
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="HEALTHY">Healthy</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
                <option value="OFFLINE">Offline</option>
              </Select>
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  Create Machine
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Machine Modal */}
      {showEditModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Edit Machine</h2>
            <form onSubmit={handleEditMachine} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm">
                  {formError}
                </div>
              )}
              <Input
                label="Machine Code"
                value={formData.machine_code}
                onChange={(e) => setFormData({ ...formData, machine_code: e.target.value.toUpperCase() })}
                required
                disabled
              />
              <Input
                label="Machine Name"
                value={formData.machine_name}
                onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                required
              />
              <Input
                label="Machine Type"
                value={formData.machine_type}
                onChange={(e) => setFormData({ ...formData, machine_type: e.target.value })}
                required
              />
              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
              <Input
                label="Installation Date"
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                required
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="HEALTHY">Healthy</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
                <option value="OFFLINE">Offline</option>
              </Select>
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  Update Machine
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMachine(null);
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">Delete Machine</h2>
            <p className="text-slate-400 mb-4">
              Are you sure you want to delete <strong>{selectedMachine.machine_name}</strong> ({selectedMachine.machine_code})?
              This action cannot be undone.
            </p>
            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm mb-4">
                {formError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDeleteMachine}
                loading={submitting}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedMachine(null);
                  setFormError('');
                }}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
