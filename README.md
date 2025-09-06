# Solana TodoList DApp

A decentralized Todo List application built on Solana blockchain using Anchor framework and Next.js.

## Features

- **On-chain storage**: All todos are stored permanently on Solana blockchain
- **Wallet integration**: Connect with Phantom wallet
- **CRUD operations**: Create, read, update, and delete todos
- **Real-time updates**: Automatic synchronization with blockchain state
- **User authentication**: Each user has their own todo list tied to their wallet

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Blockchain**: Solana, Anchor Framework
- **Wallet**: Phantom Wallet integration
- **Network**: Solana Devnet

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Phantom Wallet](https://phantom.app/) browser extension

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd solana-todolist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Solana environment**
   ```bash
   # Set to devnet
   solana config set --url devnet
   
   # Generate a new keypair (if you don't have one)
   solana-keygen new
   
   # Airdrop some SOL for testing
   solana airdrop 2
   ```

## Development Setup

### 1. Build and Deploy Smart Contract

```bash
# Build the Anchor program
anchor build

# Deploy to devnet
anchor deploy

# Run tests
anchor test
```

### 2. Start Frontend Development Server

```bash
# Start the Next.js development server
npm run dev
```

The application will be available at `http://localhost:3000`

### 3. Connect Phantom Wallet

1. Install Phantom wallet browser extension
2. Create or import a wallet
3. Switch to Devnet in Phantom settings
4. Get some test SOL from [Solana Faucet](https://faucet.solana.com/)
5. Connect your wallet to the application

## Smart Contract Details

### Program ID
Deploy your program to get the Program ID:
```bash
anchor deploy --provider.cluster devnet
```
After deployment, copy the Program ID from the output and update it in your frontend code.

### Instructions

- **initialize**: Create a new todo account for the user
- **add_content**: Add a new todo item
- **update_state**: Toggle todo completion status
- **remove_todo**: Delete a todo item
- **update_content**: Edit todo content

### Data Structure

```rust
pub struct List {
    user: Pubkey,           // Owner of the todo list
    todos: Vec<Item>,       // Vector of todo items
}

pub struct Item {
    pub content: String,    // Todo content (max 200 chars)
    pub is_done: bool,      // Completion status
}
```

### Constraints

- Maximum 20 todos per user
- Todo content limited to 200 characters
- Only the owner can modify their todos

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Initialize Account**: Click "Initialize Account" to create your on-chain todo list
3. **Add Todos**: Enter a task and click "Add Task"
4. **Toggle Completion**: Click the circle button to mark todos as complete/incomplete
5. **Delete Todos**: Click the "×" button to remove todos

## Testing

### Run Anchor Tests
```bash
anchor test
```

### Test on Devnet
1. Deploy the program to devnet
2. Update the program ID in the frontend code
3. Test all functionality through the web interface

## Project Structure

```
├── programs/
│   └── todolist/
│       └── src/
│           └── lib.rs          # Smart contract code
├── app/
│   ├── components/
│   │   └── SolanaTodoApp.tsx   # Main React component
│   └── page.tsx                # Next.js page
├── tests/
│   └── todolist.ts             # Anchor tests
└── target/
    └── idl/
        └── todolist.json       # Generated IDL
```

## Troubleshooting

### Common Issues

1. **Wallet not connecting**
   - Ensure Phantom wallet is installed and set to Devnet
   - Check if the wallet has sufficient SOL for transactions

2. **Transaction failures**
   - Verify you're on the correct network (Devnet)
   - Ensure the program is deployed and the ID matches

3. **State not updating**
   - Wait for transaction confirmation (can take a few seconds)
   - Check browser console for error messages

### Debug Commands

```bash
# Check Solana config
solana config get

# Check wallet balance
solana balance

# View program logs
solana logs <program-id>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Phantom Wallet](https://phantom.app/)
- [Next.js Documentation](https://nextjs.org/docs)