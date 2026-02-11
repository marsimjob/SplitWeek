import { createContext, useState, useEffect, useContext } from 'react';
import { childrenApi } from '../api/childrenApi';
import { useAuth } from './AuthContext';

const ChildContext = createContext(null);

export function ChildProvider({ children: reactChildren }) {
  const { isAuthenticated } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      childrenApi.getChildren()
        .then((data) => {
          setChildren(data);
          if (data.length > 0 && !selectedChild) {
            setSelectedChild(data[0]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setChildren([]);
      setSelectedChild(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshChildren = async () => {
    const data = await childrenApi.getChildren();
    setChildren(data);
    if (data.length > 0 && !selectedChild) {
      setSelectedChild(data[0]);
    }
    return data;
  };

  return (
    <ChildContext.Provider value={{ children, selectedChild, setSelectedChild, loading, refreshChildren }}>
      {reactChildren}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const context = useContext(ChildContext);
  if (!context) throw new Error('useChild must be used within ChildProvider');
  return context;
}
