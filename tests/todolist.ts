import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Todolist } from "../target/types/todolist";

describe("todolist", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.todolist as Program<Todolist>;
  const provider = anchor.getProvider();

  it("Is initialized!", async () => {
    // PDA 계산
    const [todoAccountPda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("todo-account"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // initialize 호출 - PDA를 사용
    const tx = await program.methods
      .initialize()
      .accounts({
        todoAccount: todoAccountPda, // Rust의 todo_account -> todoAccount
        userAccount: provider.wallet.publicKey, // Rust의 user_account -> userAccount  
        systemProgram: anchor.web3.SystemProgram.programId, // Rust의 system_program -> systemProgram
      } as any) // 타입 오류 우회
      .rpc();
    
    console.log("Your transaction signature", tx);
    
    // 생성된 계정 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    console.log("Todo account:", todoAccount);
  });

  it("Add content test", async () => {
    // PDA 계산
    const [todoAccountPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("todo-account"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // 콘텐츠 추가
    const tx = await program.methods
      .addContent("첫 번째 할 일")
      .accountsStrict({
        todoAccount: todoAccountPda,
        user: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("Add content tx:", tx);

    // 결과 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    console.log("Todos:", todoAccount.todos);
  });

  it("Update state test", async () => {
    // PDA 계산
    const [todoAccountPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("todo-account"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // 상태 업데이트 (첫 번째 항목을 완료로 변경)
    const tx = await program.methods
      .updateState(0)
      .accounts({
        todoAccount: todoAccountPda,
        user: provider.wallet.publicKey,
      } as any) // 타입 우회
      .rpc();
    
    console.log("Update state tx:", tx);

    // 결과 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    console.log("Updated todos:", todoAccount.todos);
  });
});