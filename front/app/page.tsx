'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  web3,
  utils,
  BN,
  setProvider
} from '@coral-xyz/anchor';

// Todo 아이템 인터페이스
interface TodoItem {
  content: string;
  is_done: boolean; // isDone -> is_done으로 변경
}

// Phantom Wallet 인터페이스
interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString(): string } | null;
  isConnected: boolean;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
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

// 프로그램 설정
const PROGRAM_ID = new PublicKey("E9WdtdnurfGF7vkAQcEXQwBnj1ykNmqTmQ4DwtKPL3Nx");
const TODO_ACCOUNT_SEED = "todo-account";

// IDL (Interface Definition Language) - 단순한 구조
const IDL = {
  "address": "E9WdtdnurfGF7vkAQcEXQwBnj1ykNmqTmQ4DwtKPL3Nx",
  "metadata": {
    "name": "todolist",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "add_content",
      "discriminator": [
        183,
        126,
        202,
        103,
        73,
        114,
        135,
        191
      ],
      "accounts": [
        {
          "name": "todo_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  100,
                  111,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "content",
          "type": "string"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "user_account",
          "writable": true,
          "signer": true
        },
        {
          "name": "todo_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  100,
                  111,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user_account"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "remove_todo",
      "discriminator": [
        28,
        167,
        91,
        69,
        25,
        225,
        253,
        117
      ],
      "accounts": [
        {
          "name": "todo_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  100,
                  111,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "update_content",
      "discriminator": [
        201,
        145,
        238,
        112,
        36,
        231,
        69,
        8
      ],
      "accounts": [
        {
          "name": "todo_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  100,
                  111,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        },
        {
          "name": "new_content",
          "type": "string"
        }
      ]
    },
    {
      "name": "update_state",
      "discriminator": [
        135,
        112,
        215,
        75,
        247,
        185,
        53,
        176
      ],
      "accounts": [
        {
          "name": "todo_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  100,
                  111,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "List",
      "discriminator": [
        169,
        24,
        186,
        110,
        22,
        139,
        190,
        82
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MaxTodosReached",
      "msg": "Maximum number of todos reached (20)"
    },
    {
      "code": 6001,
      "name": "InvalidIndex",
      "msg": "Invalid todo index"
    },
    {
      "code": 6002,
      "name": "Unauthorized",
      "msg": "Unauthorized access - you can only modify your own todos"
    },
    {
      "code": 6003,
      "name": "EmptyContent",
      "msg": "Content cannot be empty"
    },
    {
      "code": 6004,
      "name": "ContentTooLong",
      "msg": "Content too long (maximum 200 characters)"
    }
  ],
  "types": [
    {
      "name": "Item",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "is_done",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "List",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "todos",
            "type": {
              "vec": {
                "defined": {
                  "name": "Item"
                }
              }
            }
          }
        ]
      }
    }
  ]
};

// Provider 생성 함수
const getProvider = () => {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const provider = new AnchorProvider(connection, window.solana as any, {
    commitment: 'confirmed'
  });
  setProvider(provider);
  return provider;
};

// Program 인스턴스를 안전하게 생성하는 함수
const createProgram = () => {
  try {
    const provider = getProvider();
    return new Program(IDL as any, provider);
  } catch (error) {
    console.error('Program creation error:', error);
    return null;
  }
};

export default function SolanaTodoApp(): React.ReactElement {
  const [phantomWallet, setPhantomWallet] = useState<PhantomProvider | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoInput, setTodoInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Connection 설정
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // Program 설정 - 지갑이 연결되었을 때만 생성
  const program = useMemo(() => {
    if (!phantomWallet || !phantomWallet.publicKey) return null;
    return createProgram();
  }, [phantomWallet]);

  // Todo Account PDA 계산
  const getTodoAccountPDA = async (userPublicKey: PublicKey) => {
    const [todoAccountPda] = await PublicKey.findProgramAddress(
      [Buffer.from(TODO_ACCOUNT_SEED), userPublicKey.toBuffer()],
      PROGRAM_ID
    );
    return todoAccountPda;
  };

  // Phantom Wallet 연결
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

      const phantomProvider = getProvider();

      if (!phantomProvider) {
        alert('Please install Phantom Wallet!');
        window.open('https://phantom.app/', '_blank');
        return;
      }

      let publicKey: { toString(): string };
      if (phantomProvider.isConnected && phantomProvider.publicKey) {
        publicKey = phantomProvider.publicKey;
      } else {
        const response = await phantomProvider.connect();
        publicKey = response.publicKey;
      }

      setPhantomWallet(phantomProvider);
      setWalletAddress(publicKey.toString());

      // 계정 상태 확인
      setTimeout(() => {
        checkAccountStatus(new PublicKey(publicKey.toString()));
      }, 500);

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      alert('Wallet connection failed: ' + error.message);
    }
  };

  // 계정 상태 확인
  const checkAccountStatus = async (userPublicKey: PublicKey) => {
    if (!program) {
      console.log('Program not initialized yet');
      return;
    }

    try {
      const todoAccountPda = await getTodoAccountPDA(userPublicKey);
      const account = await (program.account as any).list.fetchNullable(todoAccountPda);

      if (account) {
        setInitialized(true);
        setTodos(account.todos || []);
      } else {
        console.log('Account not found');
        setInitialized(false);
        setTodos([]);
      }
    } catch (error) {
      console.log('Account check error:', error);
      setInitialized(false);
      setTodos([]);
    }
  };

  // 계정 초기화
  const initializeAccount = async (): Promise<void> => {
    if (!program || !phantomWallet?.publicKey) return;
    setLoading(true);

    try {
      const userPublicKey = new PublicKey(phantomWallet.publicKey.toString());
      const todoAccountPda = await getTodoAccountPDA(userPublicKey);

      // PDA 이미 존재하는지 확인
      const existing = await (program.account as any).list.fetchNullable(todoAccountPda);
      if (existing) {
        console.log('Account already initialized.');
        setInitialized(true);
        setTodos(existing.todos || []);
        return;
      }

      // 초기화 진행
      const tx = await program.methods
        .initialize()
        .accounts({
          todoAccount: todoAccountPda,
          userAccount: userPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Initialize transaction:', tx);
      setInitialized(true);
      await checkAccountStatus(userPublicKey);
      alert('Account initialized successfully!');
    } catch (error: any) {
      console.error('Initialize failed:', error);
      alert('Initialize failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Todo 추가
  const addTodo = async (): Promise<void> => {
    const content = todoInput.trim();

    if (!content) {
      alert('Please enter a task!');
      return;
    }

    if (!program || !phantomWallet?.publicKey) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    try {
      const userPublicKey = new PublicKey(phantomWallet.publicKey.toString());
      const todoAccountPda = await getTodoAccountPDA(userPublicKey);

      const tx = await program.methods
        .addContent(content)
        .accounts({
          todoAccount: todoAccountPda,
          user: userPublicKey,
        })
        .rpc();

      console.log('Add todo transaction:', tx);
      setTodoInput('');
      await checkAccountStatus(userPublicKey);

    } catch (error: any) {
      console.error('Add todo failed:', error);
      alert('Add todo failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Todo 상태 토글
  const toggleTodo = async (index: number): Promise<void> => {
    if (!program || !phantomWallet?.publicKey) return;

    setLoading(true);
    try {
      const userPublicKey = new PublicKey(phantomWallet.publicKey.toString());
      const todoAccountPda = await getTodoAccountPDA(userPublicKey);

      const tx = await program.methods
        .updateState(index)
        .accounts({
          todoAccount: todoAccountPda,
          user: userPublicKey,
        })
        .rpc();

      console.log('Toggle todo transaction:', tx);
      await checkAccountStatus(userPublicKey);

    } catch (error: any) {
      console.error('Toggle todo failed:', error);
      alert('Toggle todo failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Todo 삭제
  const deleteTodo = async (index: number): Promise<void> => {
    if (!program || !phantomWallet?.publicKey) return;

    setLoading(true);
    try {
      const userPublicKey = new PublicKey(phantomWallet.publicKey.toString());
      const todoAccountPda = await getTodoAccountPDA(userPublicKey);

      const tx = await program.methods
        .removeTodo(index)
        .accounts({
          todoAccount: todoAccountPda,
          user: userPublicKey,
        })
        .rpc();

      console.log('Delete todo transaction:', tx);
      await checkAccountStatus(userPublicKey);

    } catch (error: any) {
      console.error('Delete todo failed:', error);
      alert('Delete todo failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 지갑 연결 해제
  const disconnectWallet = async (): Promise<void> => {
    try {
      if (phantomWallet && phantomWallet.disconnect) {
        await phantomWallet.disconnect();
      }
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    }
    setPhantomWallet(null);
    setWalletAddress(null);
    setTodos([]);
    setInitialized(false);
  };

  // 통계 계산
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.is_done).length;
  const pendingTodos = totalTodos - completedTodos;

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !loading) {
      addTodo();
    }
  }; 
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window === 'undefined') return;
  
      const provider = window.phantom?.solana || window.solana;
      if (!provider?.isPhantom) return;
  
      try {
        // onlyIfTrusted: true → 이전에 연결 승인한 지갑이면 자동 연결
        const res = await provider.connect();
        setPhantomWallet(provider);
        setWalletAddress(res.publicKey.toString());
        console.log('Wallet auto-connected:', res.publicKey.toString());
      } catch (err) {
        console.log('Wallet not connected:', err);
      }
    };
  
    checkWalletConnection();
  }, []);
  
  // 지갑과 프로그램이 준비되면 계정 상태 확인
  useEffect(() => {
    if (phantomWallet?.publicKey && program) {
      const userPublicKey = new PublicKey(phantomWallet.publicKey.toString());
      checkAccountStatus(userPublicKey);
    }
  }, [phantomWallet, program]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-green-400 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Solana Todo List</h1>
            <p className="text-lg opacity-90">On-Chain Task Management (Devnet)</p>
          </div>

          {/* Wallet Connection Section */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {walletAddress && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Connected Wallet</p>
                  <div className="font-mono text-sm bg-white px-4 py-2 rounded-lg border border-gray-300">
                    {walletAddress.slice(0, 8) + '...' + walletAddress.slice(-8)}
                  </div>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${initialized
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {initialized ? 'Account Initialized' : 'Account Not Initialized'}
                    </span>
                  </div>
                  {program && (
                    <div className="mt-1">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Program Connected
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                {!phantomWallet ? (
                  <button
                    onClick={connectWallet}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <>
                    {!initialized && program && (
                       <button
                       onClick={initializeAccount}
                       disabled={loading}
                       className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                     >
                       {loading ? 'Initializing...' : 'Initialize Account'}
                     </button>
                    )}
                    <button
                      onClick={disconnectWallet}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Todo Section */}
          <div className="p-8">
            {!phantomWallet ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔗</div>
                <h3 className="text-xl text-gray-600 font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-gray-500">Connect your Phantom wallet to start using on-chain todos!</p>
              </div>
            ) : !program ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl text-gray-600 font-semibold mb-2">Program Loading</h3>
                <p className="text-gray-500">Setting up the Solana program connection...</p>
              </div>
            ) : !initialized ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🚀</div>
                <h3 className="text-xl text-gray-600 font-semibold mb-2">Initialize Your Account</h3>
                <p className="text-gray-500">Click "Initialize Account" to create your on-chain todo list!</p>
              </div>
            ) : (
              <>
                {/* Add Todo Form */}
                <div className="flex gap-4 mb-8 flex-wrap">
                  <input
                    type="text"
                    placeholder="Enter a new task..."
                    value={todoInput}
                    onChange={(e) => setTodoInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="flex-1 min-w-64 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition-colors text-lg disabled:opacity-50"
                  />
                  <button
                    onClick={addTodo}
                    disabled={loading || !todoInput.trim()}
                    className="bg-green-400 hover:bg-green-500 text-gray-800 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Task'}
                  </button>
                </div>

                {/* Todo List */}
                <div className="space-y-4">
                  {todos.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📝</div>
                      <h3 className="text-xl text-gray-600 font-semibold mb-2">No tasks yet</h3>
                      <p className="text-gray-500">Add your first on-chain task to get started!</p>
                    </div>
                  ) : (
                    todos.map((todo, index) => (
                      <div
                        key={index}
                        className={`bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 ${todo.is_done ? 'opacity-75 bg-green-50 border-green-200' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <button
                              onClick={() => toggleTodo(index)}
                              disabled={loading}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-50 ${todo.is_done
                                ? 'bg-green-400 border-green-400 text-white'
                                : 'border-gray-400 hover:border-green-400'
                                }`}
                            >
                              {todo.is_done && '✓'}
                            </button>
                            <div className="flex-1">
                              <p className={`text-lg font-medium ${todo.is_done ? 'line-through text-gray-500' : 'text-gray-800'
                                }`}>
                                {todo.content}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">Index: {index}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTodo(index)}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        {initialized && (
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
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 flex items-center gap-4">
              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              <span className="text-lg font-semibold">Processing transaction...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}