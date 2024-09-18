import React, { useState, useEffect } from 'react';
import './App.css';
import KanaSelection from './components/kanaSelection';
import PracticeSession from './components/practiceSession';
import CategorySelector from './components/categorySelector';
import { theme } from './theme';
import axios from 'axios';
import AuthCard from './components/AuthCard';
import ProfileButton from './components/ProfileButton';
import LogoutButton from './components/LogoutButton';

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReading, setShowReading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('hiragana');
  const [selectedKana, setSelectedKana] = useState({});
  const [flashcards, setFlashcards] = useState([]);
  const [isPracticing, setIsPracticing] = useState(false);
  const [user, setUser] = useState(null);
  const [practiceFlashcards, setPracticeFlashcards] = useState([]);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('User ID not found in localStorage');
          return;
        }
        const response = await axios.get(`http://localhost:5000/api/flashcards?category=${selectedCategory}&userId=${userId}`);
        setFlashcards(response.data);
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      }
    };

    fetchFlashcards();
  }, [selectedCategory, selectedKana]);

  useEffect(() => {
    updateFlashcards();
  }, [selectedKana]);

  const updateFlashcards = () => {
    const selectedCharacters = Object.keys(selectedKana).filter(k => selectedKana[k]);
    const newFlashcards = flashcards.filter(card =>
      selectedCharacters.includes(card.character)
    );
    setPracticeFlashcards(newFlashcards);
    setCurrentIndex(0);
    setShowReading(false);
  };

  const startPractice = () => {
    updateFlashcards();
    setIsPracticing(true);
  };
  const endPractice = () => {
    setIsPracticing(false);
    setSelectedKana({});
    setPracticeFlashcards([]);
  };

  const handleProgressUpdate = (flashcardId, correct) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }
    return axios.post(`http://localhost:5000/api/progress/${userId}`, { flashcardId, correct })
      .then(response => {
        console.log('Progress updated:', response.data);
        return response.data.streak;
      })
      .catch(error => {
        console.error('Error updating progress:', error);
        throw error;
      });
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user.id);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error logging in:', error.response?.data?.msg);
      throw error;
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', { username, email, password });
      console.log(response.data.msg); 
      await handleLogin(email, password);
    } catch (error) {
      console.error('Error registering:', error.response.data.msg);

    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${theme[selectedCategory].bg} p-4`}>
      <header className="text-center mb-8">
        <h1 className={`text-4xl font-bold mb-6 text-${theme[selectedCategory].primary}-800`}>Kana Flashcards</h1>
        {!user ? (
          <AuthCard onLogin={handleLogin} onRegister={handleRegister} />
        ) : (
          <>

            {!isPracticing ? (
              <>
                <CategorySelector 
                  selectedCategory={selectedCategory} 
                  setSelectedCategory={setSelectedCategory} 
                  setSelectedKana={setSelectedKana}
                />
                <KanaSelection 
                  selectedCategory={selectedCategory} 
                  selectedKana={selectedKana} 
                  setSelectedKana={setSelectedKana}
                  flashcards={flashcards}
                />
                <button 
                  onClick={startPractice} 
                  disabled={!Object.values(selectedKana).some(Boolean)}
                  className={`px-8 py-4 ${Object.values(selectedKana).some(Boolean) ? `bg-${theme[selectedCategory].secondary}-500` : 'bg-gray-500'} text-white rounded-full shadow-md hover:bg-${theme[selectedCategory].secondary}-600 transition duration-300 text-xl font-bold`}
                >
                  Start Practice
                </button>
                <div className="flex justify-center space-x-4 mb-4 mt-4">
                  <ProfileButton onClick={() => {
                    // Navigate to profile (implement your profile navigation logic)
                  }} />
                  <LogoutButton onClick={handleLogout} />
                </div>
              </>
            ) : (
              <PracticeSession 
                flashcards={practiceFlashcards}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                endPractice={endPractice}
                selectedCategory={selectedCategory}
                handleProgressUpdate={handleProgressUpdate}
              />
            )}
          </>
        )}
      </header>
    </div>
  );
}

export default App;
