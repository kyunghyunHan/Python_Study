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

        // 권한 검증
        require!(
            todo_account.user == ctx.accounts.user.key(),
            TodoError::Unauthorized
        );

        // 입력 검증
        require!(!content.trim().is_empty(), TodoError::EmptyContent);
        require!(content.len() <= 200, TodoError::ContentTooLong);

        // 최대 할일 개수 검증
        require!(todo_account.todos.len() < 20, TodoError::MaxTodosReached);

        todo_account.todos.push(Item {
            content: content.trim().to_string(),
            is_done: false,
        });

        Ok(())
    }

    pub fn update_state(ctx: Context<UpdateState>, index: u8) -> Result<()> {
        let todo_account = &mut ctx.accounts.todo_account;

        // 권한 검증
        require!(
            todo_account.user == ctx.accounts.user.key(),
            TodoError::Unauthorized
        );

        // 인덱스 검증
        require!(
            (index as usize) < todo_account.todos.len(),
            TodoError::InvalidIndex
        );

        let task = &mut todo_account.todos[index as usize];
        task.is_done = !task.is_done;

        Ok(())
    }

    pub fn remove_todo(ctx: Context<UpdateState>, index: u8) -> Result<()> {
        let todo_account = &mut ctx.accounts.todo_account;

        // 권한 검증
        require!(
            todo_account.user == ctx.accounts.user.key(),
            TodoError::Unauthorized
        );

        // 인덱스 검증
        require!(
            (index as usize) < todo_account.todos.len(),
            TodoError::InvalidIndex
        );

        todo_account.todos.remove(index as usize);
        Ok(())
    }

    pub fn update_content(ctx: Context<UpdateState>, index: u8, new_content: String) -> Result<()> {
        let todo_account = &mut ctx.accounts.todo_account;

        // 권한 검증
        require!(
            todo_account.user == ctx.accounts.user.key(),
            TodoError::Unauthorized
        );

        // 입력 검증
        require!(!new_content.trim().is_empty(), TodoError::EmptyContent);
        require!(new_content.len() <= 200, TodoError::ContentTooLong);

        // 인덱스 검증
        require!(
            (index as usize) < todo_account.todos.len(),
            TodoError::InvalidIndex
        );

        let task = &mut todo_account.todos[index as usize];
        task.content = new_content.trim().to_string();

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
        space = 8 + 32 + 4 + (20 * (4 + 200 + 1)), // 계산된 공간: discriminator + Pubkey + Vec length + (20 todos * (String length + content + bool))
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
    #[msg("Maximum number of todos reached (20)")]
    MaxTodosReached,
    #[msg("Invalid todo index")]
    InvalidIndex,
    #[msg("Unauthorized access - you can only modify your own todos")]
    Unauthorized,
    #[msg("Content cannot be empty")]
    EmptyContent,
    #[msg("Content too long (maximum 200 characters)")]
    ContentTooLong,
}