use anchor_lang::prelude::*;

declare_id!("E9WdtdnurfGF7vkAQcEXQwBnj1ykNmqTmQ4DwtKPL3Nx");

#[program]
pub mod todolist {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let todo_account = &mut ctx.accounts.todo_account;
        todo_account.user = ctx.accounts.user_account.key();
        todo_account.todos = vec![];
        Ok(())
    }

    pub fn add_content(ctx: Context<AddContent>, content: String) -> Result<()> {
        let todo_account = &mut ctx.accounts.todo_account;

        require!(todo_account.todos.len() < 20, TodoError::MaxTodosReached);

        todo_account.todos.push(Item {
            content,
            is_done: false,
        });

        Ok(())
    }

    pub fn update_state(ctx: Context<UpdateState>, index: u8) -> Result<()> {
        let todo_account = &mut ctx.accounts.todo_account;

        require!(
            (index as usize) < todo_account.todos.len(),
            TodoError::InvalidIndex
        );

        let task = &mut todo_account.todos[index as usize];
        task.is_done = !task.is_done;

        Ok(())
    }
}

pub const TODO_ACCOUNT_SEED: &[u8] = b"todo-account";

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user_account: Signer<'info>,

    #[account(
        init,
        payer = user_account,
        space = 1024,
        seeds = [TODO_ACCOUNT_SEED, user_account.key.as_ref()],
        bump
    )]
    pub todo_account: Account<'info, List>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddContent<'info> {
    #[account(
        mut,
        seeds = [TODO_ACCOUNT_SEED, user.key().as_ref()],
        bump
    )]
    pub todo_account: Account<'info, List>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateState<'info> {
    #[account(
        mut,
        seeds = [TODO_ACCOUNT_SEED, user.key().as_ref()],
        bump
    )]
    pub todo_account: Account<'info, List>,
    pub user: Signer<'info>,
}

#[account]
pub struct List {
    user: Pubkey,
    todos: Vec<Item>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct Item {
    pub content: String,
    pub is_done: bool,
}

#[error_code]
pub enum TodoError {
    #[msg("Maximum number of todos reached")]
    MaxTodosReached,
    #[msg("Invalid todo index")]
    InvalidIndex,
    #[msg("Unauthorized access")]
    Unauthorized,
}