use anchor_lang::prelude::*;

declare_id!("E9WdtdnurfGF7vkAQcEXQwBnj1ykNmqTmQ4DwtKPL3Nx");

#[program]
pub mod todolist {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
