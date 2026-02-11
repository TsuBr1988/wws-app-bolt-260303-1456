import React, { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { MeetingMinute, meetingMinutesService, CreateMeetingMinute } from '../../services/meetingMinutesService';
import { MeetingMinutesForm } from './MeetingMinutesForm';
import { MeetingMinutesCard } from './MeetingMinutesCard';
import { MeetingMinutesViewModal } from './MeetingMinutesViewModal';

interface AtasTabProps {
  responsaveis: string[];
  onAddAction: () => void;
}

export const AtasTab: React.FC<AtasTabProps> = ({
  responsaveis,
  onAddAction
}) => {
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);
  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null);
  const [tempMinuteData, setTempMinuteData] = useState<CreateMeetingMinute | null>(null);

  useEffect(() => {
    loadMinutes();
  }, []);

  const loadMinutes = async () => {
    try {
      setLoading(true);
      const data = await meetingMinutesService.getAllMeetingMinutes();
      setMinutes(data);
    } catch (error) {
      console.error('Error loading meeting minutes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMinute = async (minute: CreateMeetingMinute) => {
    try {
      await meetingMinutesService.createMeetingMinute(minute);
      await loadMinutes();
      setTempMinuteData(null);
    } catch (error) {
      console.error('Error creating meeting minute:', error);
      throw error;
    }
  };

  const handleUpdateMinute = async (minute: CreateMeetingMinute) => {
    if (!editingMinute) return;

    try {
      await meetingMinutesService.updateMeetingMinute(editingMinute.id, minute);
      await loadMinutes();
      setEditingMinute(null);
      setTempMinuteData(null);
    } catch (error) {
      console.error('Error updating meeting minute:', error);
      throw error;
    }
  };

  const handleDeleteMinute = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ata?')) return;

    try {
      await meetingMinutesService.deleteMeetingMinute(id);
      await loadMinutes();
    } catch (error) {
      console.error('Error deleting meeting minute:', error);
    }
  };

  const handleViewMinute = (minute: MeetingMinute) => {
    setSelectedMinute(minute);
    setIsViewModalOpen(true);
  };

  const handleEditMinute = (minute: MeetingMinute) => {
    setEditingMinute(minute);
    setIsFormOpen(true);
  };

  const handleAddActionFromForm = (tempData: CreateMeetingMinute) => {
    setTempMinuteData(tempData);
    setIsFormOpen(false);
    onAddAction();
  };

  const handleAddActionFromView = () => {
    setIsViewModalOpen(false);
    onAddAction();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMinute(null);
    setTempMinuteData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando ATAs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ATAs</h2>
          <p className="text-gray-600 mt-1">Gerencie suas atas de reunião</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Começar ATA
        </button>
      </div>

      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total de ATAs</h3>
              <p className="text-sm text-gray-600">Documentos registrados</p>
            </div>
          </div>
          <span className="text-4xl font-bold text-blue-600">{minutes.length}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {minutes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma ATA encontrada</h3>
            <p className="text-gray-600">Comece uma nova ATA para documentar suas reuniões</p>
          </div>
        ) : (
          minutes.map(minute => (
            <MeetingMinutesCard
              key={minute.id}
              minute={minute}
              onView={handleViewMinute}
              onEdit={handleEditMinute}
              onDelete={handleDeleteMinute}
            />
          ))
        )}
      </div>

      <MeetingMinutesForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingMinute ? handleUpdateMinute : handleCreateMinute}
        onAddAction={handleAddActionFromForm}
        minute={editingMinute}
        tempData={tempMinuteData}
      />

      <MeetingMinutesViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        minute={selectedMinute}
        onAddAction={handleAddActionFromView}
      />
    </div>
  );
};
