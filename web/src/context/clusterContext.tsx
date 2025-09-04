import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext } from 'react';
const DEFAULT_CLUSTER = "default";
interface ClusterContextProps {
  cluster: string;
  setCluster: (cluster: string) => void;
   resetCluster: () => void;
}

const ClusterContext = createContext<ClusterContextProps | undefined>(undefined);
const switchCluster = async (newPrefix: string) => {
  try {
    const response = await fetch('http://localhost:9000/cluster-switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: newPrefix }),
    });

    const contentType = response.headers.get("Content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Réponse inattendue: ${text.slice(0, 100)}...`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur inconnue');
    }
  } catch (error) {
    console.error('Erreur lors du changement de cluster:', error);
  }
};

export const ClusterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cluster, setClusterState] = React.useState<string | null>(DEFAULT_CLUSTER);
const resetCluster = () => {
   const token = localStorage.getItem('token');
   if (token) {
      const payload = jwtDecode<{ instance: string }>(token);
      if (payload.instance) {
        setCluster(payload.instance);
      } else {
        setCluster(DEFAULT_CLUSTER); 
      }
    }
}
  React.useEffect(() => {
    const storedCluster = localStorage.getItem('active_cluster') || 'default';
    setClusterState(storedCluster);
  }, []);
  const setCluster = async (value: string) => {
    setClusterState(value);
    localStorage.setItem('active_cluster', value);
   window.location.reload();
   await switchCluster(value);
  };

  if (cluster === null) {
    return <div>Chargement du cluster...</div>;
  }
  return (
    <ClusterContext.Provider value={{ cluster, setCluster,resetCluster }}>
      {children}
    </ClusterContext.Provider>
  );
};

export const useCluster = () => {
  const context = useContext(ClusterContext);
  if (!context) {
    throw new Error('useCluster must be used within a ClusterProvider');
  }
  return context;
};
