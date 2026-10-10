import { useState, useEffect } from 'react';
import { PageLoader, ErrorState, EmptyState, Card, Button, Input, Select } from '../components/ui/UIComponents';
import { Wrench, Plus, RefreshCw, Edit, Trash2, DollarSign, Calendar } from 'lucide-react';
import { maintenanceService, machineService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MaintenancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    machine_id: '',
    maintenance_date: '',
    maintenance_type: 'PREVENTIVE',
    description: '',
    technician: '',
    cost: 0,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [typeFilter, machineFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsRes, machinesRes] = await Promise.all([
        maintenanceService.list({
          machine_id: machineFilter || undefined,
          maintenance_type: typeFilter || undefined,
        }).catch(err => {
          console.error('Maintenance API error:', err);
          return { data: [] };
        }),
        machineService.list({ limit: 100 }).catch(err => {
          console.error('Machines API error:', err);
          return { data: [] };
        }),
      ]);

      setRecords(recordsRes.data || []);
      setMachines(machinesRes.data || []);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
      setError('Failed to load maintenance records. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await maintenanceService.create(formData);
      setShowAddModal(false);
      setFormData({
        machine_id: '',
        maintenance_date: '',
        maintenance_type: 'PREVENTIVE',
        description: '',
        technician: '',
        cost: 0,
      });
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create maintenance record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await maintenanceService.update(selectedRecord.id, formData);
      setShowEditModal(false);
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to update maintenance record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    setSubmitting(true);
    try {
      await maintenanceService.delete(selectedRecord.id);
      setShowDeleteModal(false);
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to delete maintenance record');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setFormData({
      machine_id: record.machine_id,
      maintenance_date: record.maintenance_date,
      maintenance_type: record.maintenance_type,
      description: record.description,
      technician: record.technician,
      cost: record.cost,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const canEdit = user?.role === 'admin' || user?.role === 'engineer';
  const canDelete = user?.role === 'admin';

  // Calculate summary
  const totalRecords = records.length;
  const preventiveRecords = records.filter(r => r.maintenance_type === 'PREVENTIVE').length;
  const correctiveRecords = records.filter(r => r.maintenance_type === 'CORRECTIVE').length;
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const avgCost = totalRecords > 0 ? totalCost / totalRecords : 0;

  if (loading) {
    return (
      <div className="p-6">
        <PageLoader message="Loading maintenance records..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track and manage machine maintenance records and work orders
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddModal(true)} icon={Plus}>
            Add Maintenance
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Records</p>
              <p className="text-2xl font-bold text-white">{totalRecords}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Preventive</p>
              <p className="text-2xl font-bold text-white">{preventiveRecords}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Corrective</p>
              <p className="text-2xl font-bold text-white">{correctiveRecords}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Cost</p>
              <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="PREVENTIVE">Preventive</option>
              <option value="CORRECTIVE">Corrective</option>
              <option value="INSPECTION">Inspection</option>
              <option value="OVERHAUL">Overhaul</option>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
            >
              <option value="">All Machines</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.machine_code} - {machine.machine_name}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" onClick={loadData} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Maintenance Table */}
      {records.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No Maintenance Records"
          description={typeFilter || machineFilter ? "Try adjusting your filters." : "No maintenance records have been created yet."}
          action={canEdit && !typeFilter && !machineFilter && (
            <Button onClick={() => setShowAddModal(true)} icon={Plus}>Add Maintenance</Button>
          )}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Machine</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Technician</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Cost</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-slate-300">
                      {record.machine_code} - {record.machine_name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(record.maintenance_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{record.maintenance_type}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{record.description}</td>
                    <td className="py-3 px-4 text-slate-300">{record.technician}</td>
                    <td className="py-3 px-4 text-slate-300">${record.cost?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(record)}
                            icon={Edit}
                          />
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(record)}
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

      {/* Add Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Add Maintenance Record</h2>
            <form onSubmit={handleAddRecord} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm">
                  {formError}
                </div>
              )}
              <Select
                label="Machine"
                value={formData.machine_id}
                onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                required
              >
                <option value="">Select a machine</option>
                {machines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.machine_code} - {machine.machine_name}
                  </option>
                ))}
              </Select>
              <Input
                label="Maintenance Date"
                type="date"
                value={formData.maintenance_date}
                onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                required
              />
              <Select
                label="Maintenance Type"
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
              >
                <option value="PREVENTIVE">Preventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="INSPECTION">Inspection</option>
                <option value="OVERHAUL">Overhaul</option>
              </Select>
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the maintenance work performed"
                required
              />
              <Input
                label="Technician"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                placeholder="Technician name"
                required
              />
              <Input
                label="Cost ($)"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  Create Record
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

      {/* Edit Maintenance Modal */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Edit Maintenance Record</h2>
            <form onSubmit={handleEditRecord} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm">
                  {formError}
                </div>
              )}
              <Select
                label="Machine"
                value={formData.machine_id}
                onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                required
                disabled
              >
                <option value="">Select a machine</option>
                {machines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.machine_code} - {machine.machine_name}
                  </option>
                ))}
              </Select>
              <Input
                label="Maintenance Date"
                type="date"
                value={formData.maintenance_date}
                onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                required
              />
              <Select
                label="Maintenance Type"
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
              >
                <option value="PREVENTIVE">Preventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="INSPECTION">Inspection</option>
                <option value="OVERHAUL">Overhaul</option>
              </Select>
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <Input
                label="Technician"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                required
              />
              <Input
                label="Cost ($)"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  Update Record
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRecord(null);
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
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">Delete Maintenance Record</h2>
            <p className="text-slate-400 mb-4">
              Are you sure you want to delete this maintenance record? This action cannot be undone.
            </p>
            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm mb-4">
                {formError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDeleteRecord}
                loading={submitting}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRecord(null);
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
