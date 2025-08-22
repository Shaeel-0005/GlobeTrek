'use client'

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      }
      // Set name from location state or fetch if not present
      if (location.state?.userName) {
        setUserName(location.state.userName);
      } else {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        if (userError) console.error(userError);
        else setUserName(userData.name);
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.state]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Welcome, {userName || 'Traveler'}!</h2>
        <p className="text-center">Start creating your travel memories!</p>
        <Link to="/add-journal">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
            Add Journal
          </button>
        </Link>
        {/* Add map, timeline, or journal entry components here */}
      </div>
    </div>
  );
}