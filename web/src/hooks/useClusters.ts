
import { useEffect, useState } from 'react';

export interface Cluster {
  name: string;
  prefix: string;
}
type ClusterData = Record<string, {
    Prefix: string;
  }>;

export function useClusters() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClusters() {
      try {
        const response = await fetch('http://localhost:9000/clusters');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

        const data: ClusterData = await response.json();

        const clusterArray: Cluster[] = Object.entries(data).map(([name, obj]) => ({
          name,
          prefix: obj.Prefix
        }));

        setClusters(clusterArray);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchClusters();
  }, []);

  return { clusters, loading, error };
}
