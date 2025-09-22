import { useState } from 'react';
import CreateElectionForm from '@/components/admin/CreateElectionForm';
import { useNavigate } from 'react-router-dom';

export default function AdminCreate() {
  const navigate = useNavigate();

  const handleElectionCreated = () => {
    navigate('/admin/elections');
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Election</h1>
        <p className="text-muted-foreground">
          Set up a new election with custom criteria and AI evaluation
        </p>
      </div>

      <CreateElectionForm onElectionCreated={handleElectionCreated} />
    </div>
  );
}