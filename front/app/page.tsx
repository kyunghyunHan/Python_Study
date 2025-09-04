'use client';
import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  timestamp: string;
}

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString(): string } | null;
  isConnected: boolean;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  on(event: string, callback: (args: any) => void): void;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider;
  }
}

export default function SolanaTodoApp(): React.ReactElement {
  const [wallet, setWallet] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoInput, setTodoInput] = useState<string>('');
  const [todoCounter, setTodoCounter] = useState<number>(0);

  // Connect Phantom Wallet
  const connectWallet = async (): Promise<void> => {
    try {
      const getProvider = (): PhantomProvider | null => {
        if (typeof window !== 'undefined') {
          if (window.phantom?.solana?.isPhantom) {
            return window.phantom.solana;
          }
          if (window.solana?.isPhantom) {
            return window.solana;
          }
        }
        return null;
      };

      const provider = getProvider();
      
      if (!provider) {
        alert('Please install Phantom Wallet!');
        window.open('https://phantom.app/', '_blank');
        return;
      }

      let publicKey: { toString(): string };
      if (provider.isConnected && provider.publicKey) {
        publicKey = provider.publicKey;
      } else {
        const response = await provider.connect();
        publicKey = response.publicKey;
      }
      
      setWallet(publicKey.toString());
      
      // Wallet state change listeners
      provider.on('connect', (publicKey: { toString(): string }) => {
        console.log('Wallet connected:', publicKey.toString());
        setWallet(publicKey.toString());
      });
      
      provider.on('disconnect', () => {
        console.log('Wallet disconnected');
        setWallet(null);
      });

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      if (error.code === 4001) {
        alert('User rejected wallet connection.');
      } else {
        alert('Wallet connection failed: ' + error.message);
      }
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        const provider = window.phantom?.solana || window.solana;
        if (provider && provider.disconnect) {
          await provider.disconnect();
        }
      }
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    }
    setWallet(null);
  };

  // Todo functions
  const addTodo = (): void => {
    const text = todoInput.trim();
    
    if (!text) {
      alert('Please enter a task!');
      return;
    }

    const newTodo: Todo = {
      id: todoCounter + 1,
      text: text,
      completed: false,
      timestamp: new Date().toLocaleString()
    };

    setTodos([...todos, newTodo]);
    setTodoCounter(todoCounter + 1);
    setTodoInput('');
  };

  const toggleTodo = (id: number): void => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number): void => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Calculate statistics
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = totalTodos - completedTodos;

  // Check wallet status on component mount
  useEffect(() => {
    const checkWallet = async (): Promise<void> => {
      if (typeof window !== 'undefined') {
        // Check wallet after short delay
        setTimeout(() => {
          const getProvider = (): PhantomProvider | null => {
            if (window.phantom?.solana?.isPhantom) {
              return window.phantom.solana;
            }
            if (window.solana?.isPhantom) {
              return window.solana;
            }
            return null;
          };

          const provider = getProvider();
          
          if (provider && provider.isConnected && provider.publicKey) {
            setWallet(provider.publicKey.toString());
            console.log('Wallet already connected:', provider.publicKey.toString());
          }
        }, 1000);
      }
    };

    checkWallet();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-green-400 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Solana Todo List</h1>
            <p className="text-lg opacity-90">Blockchain-based Task Management</p>
          </div>

          {/* Wallet Connection Section */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {wallet && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Connected Wallet</p>
                  <div className="font-mono text-sm bg-white px-4 py-2 rounded-lg border border-gray-300">
                    {wallet.slice(0, 8) + '...' + wallet.slice(-8)}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                {!wallet ? (
                  <button 
                    onClick={connectWallet}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <button 
                    onClick={disconnectWallet}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Todo Section */}
          <div className="p-8">
            {/* Add Todo Form */}
            <div className="flex gap-4 mb-8 flex-wrap">
              <input 
                type="text" 
                placeholder="Enter a new task..."
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-w-64 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition-colors text-lg"
              />
              <button 
                onClick={addTodo}
                className="bg-green-400 hover:bg-green-500 text-gray-800 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Add Task
              </button>
            </div>

            {/* Todo List */}
            <div className="space-y-4">
              {todos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <h3 className="text-xl text-gray-600 font-semibold mb-2">No tasks yet</h3>
                  <p className="text-gray-500">Add your first task to get started!</p>
                </div>
              ) : (
                todos.map(todo => (
                  <div 
                    key={todo.id}
                    className={`bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 ${
                      todo.completed ? 'opacity-75 bg-green-50 border-green-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button 
                          onClick={() => toggleTodo(todo.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            todo.completed 
                            ? 'bg-green-400 border-green-400 text-white' 
                            : 'border-gray-400 hover:border-green-400'
                          }`}
                        >
                          {todo.completed && '✓'}
                        </button>
                        <div className="flex-1">
                          <p className={`text-lg font-medium ${
                            todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                          }`}>
                            {todo.text}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">{todo.timestamp}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteTodo(todo.id)}
                        className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
            <div className="text-3xl font-bold text-purple-600">{totalTodos}</div>
            <div className="text-gray-600 font-medium">Total Tasks</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
            <div className="text-3xl font-bold text-yellow-500">{pendingTodos}</div>
            <div className="text-gray-600 font-medium">Pending</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
            <div className="text-3xl font-bold text-green-400">{completedTodos}</div>
            <div className="text-gray-600 font-medium">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}