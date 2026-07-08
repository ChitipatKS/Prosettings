'use client';

import { use } from 'react';
import PlayerForm from '@/components/PlayerForm';

type Params = {
  id: string;
};

type Props = {
  params: Promise<Params>;
};

export default function AdminEditPlayerPage({ params }: Props) {
  const resolvedParams = use(params);
  const playerId = parseInt(resolvedParams.id, 10);

  return <PlayerForm title="Edit Player Profile" isEdit={true} playerId={playerId} />;
}
