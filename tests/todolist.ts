import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Todolist } from "../target/types/todolist";
import { expect } from "chai";

describe("todolist", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.todolist as Program<Todolist>;
  const provider = anchor.getProvider();
  
  let todoAccountPda: anchor.web3.PublicKey;
  let bump: number;

  before(async () => {
    // PDA 계산 - 모든 테스트에서 재사용
    [todoAccountPda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("todo-account"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Is initialized!", async () => {
    // initialize 호출 - PDA를 사용
    const tx = await program.methods
      .initialize()
      .accounts({
        todoAccount: todoAccountPda,
        userAccount: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();
    
    console.log("Initialize transaction signature:", tx);
    
    // 생성된 계정 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    expect(todoAccount.user.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(todoAccount.todos).to.have.length(0);
    console.log("Todo account initialized successfully");
  });

  it("Add content test", async () => {
    // 콘텐츠 추가
    const content = "첫 번째 할 일";
    const tx = await program.methods
      .addContent(content)
      .accountsStrict({
        todoAccount: todoAccountPda,
        user: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("Add content tx:", tx);

    // 결과 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    expect(todoAccount.todos).to.have.length(1);
    expect(todoAccount.todos[0].content).to.equal(content);
    expect(todoAccount.todos[0].isDone).to.be.false;
    console.log("Content added successfully:", todoAccount.todos[0]);
  });

  it("Add multiple contents", async () => {
    const contents = ["두 번째 할 일", "세 번째 할 일", "네 번째 할 일"];
    
    for (const content of contents) {
      await program.methods
        .addContent(content)
        .accountsStrict({
          todoAccount: todoAccountPda,
          user: provider.wallet.publicKey,
        })
        .rpc();
    }

    const todoAccount = await program.account.list.fetch(todoAccountPda);
    expect(todoAccount.todos).to.have.length(4);
    console.log("Multiple contents added. Total todos:", todoAccount.todos.length);
  });

  it("Update state test", async () => {
    // 첫 번째 항목을 완료로 변경
    const tx = await program.methods
      .updateState(0)
      .accounts({
        todoAccount: todoAccountPda,
        user: provider.wallet.publicKey,
      } as any)
      .rpc();
    
    console.log("Update state tx:", tx);

    // 결과 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    expect(todoAccount.todos[0].isDone).to.be.true;
    console.log("Todo state updated:", todoAccount.todos[0]);
  });

  it("Update content test", async () => {
    const newContent = "수정된 첫 번째 할 일";
    
    const tx = await program.methods
      .updateContent(0, newContent)
      .accounts({
        todoAccount: todoAccountPda,
        user: provider.wallet.publicKey,
      } as any)
      .rpc();
    
    console.log("Update content tx:", tx);

    // 결과 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    expect(todoAccount.todos[0].content).to.equal(newContent);
    console.log("Content updated:", todoAccount.todos[0]);
  });

  it("Remove todo test", async () => {
    // 첫 번째 항목 삭제
    const tx = await program.methods
      .removeTodo(0)
      .accounts({
        todoAccount: todoAccountPda,
        user: provider.wallet.publicKey,
      } as any)
      .rpc();
    
    console.log("Remove todo tx:", tx);

    // 결과 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    expect(todoAccount.todos).to.have.length(3);
    expect(todoAccount.todos[0].content).to.equal("두 번째 할 일");
    console.log("Todo removed. Remaining todos:", todoAccount.todos.length);
  });

  it("Error handling - Empty content", async () => {
    try {
      await program.methods
        .addContent("")
        .accountsStrict({
          todoAccount: todoAccountPda,
          user: provider.wallet.publicKey,
        })
        .rpc();
      
      // 여기 도달하면 안됨
      expect.fail("Should have thrown an error for empty content");
    } catch (error) {
      expect(error.error.errorMessage).to.include("Content cannot be empty");
      console.log("Empty content error handled correctly");
    }
  });

  it("Error handling - Content too long", async () => {
    const longContent = "a".repeat(201); // 201자
    
    try {
      await program.methods
        .addContent(longContent)
        .accountsStrict({
          todoAccount: todoAccountPda,
          user: provider.wallet.publicKey,
        })
        .rpc();
      
      expect.fail("Should have thrown an error for content too long");
    } catch (error) {
      expect(error.error.errorMessage).to.include("Content too long");
      console.log("Long content error handled correctly");
    }
  });

  it("Error handling - Invalid index", async () => {
    try {
      await program.methods
        .updateState(99) // 존재하지 않는 인덱스
        .accounts({
          todoAccount: todoAccountPda,
          user: provider.wallet.publicKey,
        } as any)
        .rpc();
      
      expect.fail("Should have thrown an error for invalid index");
    } catch (error) {
      expect(error.error.errorMessage).to.include("Invalid todo index");
      console.log("Invalid index error handled correctly");
    }
  });

  it("Error handling - Max todos reached", async () => {
    // 현재 3개가 있으므로 17개 더 추가해서 20개로 만들기
    for (let i = 0; i < 17; i++) {
      await program.methods
        .addContent(`할 일 ${i + 4}`)
        .accountsStrict({
          todoAccount: todoAccountPda,
          user: provider.wallet.publicKey,
        })
        .rpc();
    }

    // 21번째 추가 시도
    try {
      await program.methods
        .addContent("21번째 할 일")
        .accountsStrict({
          todoAccount: todoAccountPda,
          user: provider.wallet.publicKey,
        })
        .rpc();
      
      expect.fail("Should have thrown an error for max todos reached");
    } catch (error) {
      expect(error.error.errorMessage).to.include("Maximum number of todos reached");
      console.log("Max todos error handled correctly");
    }

    // 총 20개인지 확인
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    expect(todoAccount.todos).to.have.length(20);
    console.log("Max todos limit enforced correctly");
  });

  it("Final state check", async () => {
    const todoAccount = await program.account.list.fetch(todoAccountPda);
    console.log("\n=== Final Todo List State ===");
    console.log(`Total todos: ${todoAccount.todos.length}`);
    todoAccount.todos.forEach((todo, index) => {
      console.log(`${index}: [${todo.isDone ? "✓" : " "}] ${todo.content}`);
    });
    console.log("============================\n");
  });
});