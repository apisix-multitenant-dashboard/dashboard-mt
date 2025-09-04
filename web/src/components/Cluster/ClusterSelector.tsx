// import { useCluster } from '@/context/clusterContext';
// import { useClusters } from '@/hooks/useClusters';

// import React from 'react';


// const ClusterSelector: React.FC = () => {
//   const { clusters, loading, error } = useClusters();
//   const { cluster, setCluster } = useCluster();

//     const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newCluster = e.target.value;
//     setCluster(newCluster);

//   };
//   if (loading) return <div>Chargement des clusters...</div>;
//   if (error) return <div>Erreur : {error}</div>;


//   return (
//     <select value={cluster} onChange={handleChange}>
//       {clusters.map(c => (
//         <option key={c.name} value={c.name}>
//           {c.name}
//         </option>
//       ))}
//     </select>
//   );
// };

// export default ClusterSelector;


import { Alert,Button, Carousel, Modal, Space, Tag, Typography } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useCluster } from '@/context/clusterContext';
import { useClusters } from '@/hooks/useClusters';

const { Text, Title } = Typography;

const ClusterSelector: React.FC = () => {
  const { clusters, loading, error } = useClusters();
  const { cluster, setCluster } = useCluster();

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const carouselRef = useRef<CarouselRef>(null);

  // Liste sécurisée (jamais undefined)
  const items = useMemo(() => clusters || [], [clusters]);

  // Aligner l'index sur le cluster courant dès que données prêtes
  useEffect(() => {
    if (!loading && items.length > 0) {
      const i = items.findIndex((c) => c?.name === cluster);
      const safeIndex = i >= 0 ? i : 0;
      setIdx(safeIndex);
      // Positionner le carousel sans animation (évite flash blanc)
      setTimeout(() => carouselRef.current?.goTo(safeIndex, false), 0);
    }
  }, [loading, items, cluster, open]);

  const onOk = async () => {
    const selected = items[idx];
    if (selected && selected.name && selected.name !== cluster) {
      try {
        setCluster(selected.name);
        // Si tu as une API pour basculer côté backend, appelle-la ici :
        // await switchCluster(selected.name);
      } catch (e) {
        // Optionnel: feedback utilisateur si l'appel backend échoue
        console.error('Switch cluster failed:', e);
      }
    }
    setOpen(false);
  };

  const onChange = (current: number) => setIdx(current);

  // Bouton d’ouverture : toujours sûr
  const buttonLabel = cluster || (items[0]?.name ?? 'Sélectionner un cluster');

  return (
    <>
      <Button size="middle" onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>

      <Modal
        title="Select an instance"
        open={open}
        onOk={onOk}
        onCancel={() => setOpen(false)}
        okText="Valider"
        cancelText="Annuler"
        destroyOnClose
        maskClosable
      >
        {loading && <Text>Chargement des clusters…</Text>}

        {!loading && error && (
          <Alert type="error" message="Erreur" description={String(error)} showIcon />
        )}

        {!loading && !error && items.length === 0 && (
          <Alert type="warning" message="Aucun cluster disponible" />
        )}

        {!loading && !error && items.length > 0 && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Carousel
              ref={carouselRef}
              dots
              afterChange={onChange}
              swipe
              draggable
              adaptiveHeight
            >
              {items.map((c) => (
                <div key={c.name}>
                  <div
                    style={{
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {c.name}
                    </Title>
                    {/* Affiche quelques tags / infos si disponibles */}
                    <Space>
                      <Tag color="blue">Prefix</Tag>
                      {c.prefix ? <Tag>{c.prefix}</Tag> : null}
                    </Space>
                  </div>
                </div>
              ))}
            </Carousel>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
               Swipe horizontally to cycle through instances
              </Text>
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default ClusterSelector;
