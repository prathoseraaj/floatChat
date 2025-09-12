import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="relative w-12 h-12 rounded-full backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-600/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative w-6 h-6">
        <Sun 
          size={20} 
          className={`absolute inset-0 transition-all duration-500 ${
            isDark 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
          } text-amber-500 group-hover:text-amber-600`}
        />
        <Moon 
          size={20} 
          className={`absolute inset-0 transition-all duration-500 ${
            isDark 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          } text-blue-400 group-hover:text-blue-300`}
        />
      </div>
    </Button>
  );
};

export default ThemeToggle;
