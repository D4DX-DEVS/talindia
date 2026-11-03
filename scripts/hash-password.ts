/**
 * Prints a password hash for the ADMIN_PASSWORD_HASH secret.
 *   npm run admin:hash            # prompts (input hidden)
 *   echo -n "pw" | npm run admin:hash -- --stdin
 * Then: npx wrangler secret put ADMIN_PASSWORD_HASH   (paste the output)
 */
import { createInterface } from "node:readline";
import { hashPassword } from "../src/lib/auth/password";

async function readPassword(): Promise<string> {
  if (process.argv.includes("--stdin")) {
    let data = "";
    for await (const chunk of process.stdin) data += chunk;
    return data.replace(/\r?\n$/, "");
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput.bind(rl);
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
    write(s.startsWith("Password") ? s : "");
  };
  return new Promise((resolve) => rl.question("Password: ", (answer) => {
    rl.close();
    process.stdout.write("\n");
    resolve(answer);
  }));
}

async function main(): Promise<void> {
  const password = await readPassword();
  if (password.length < 12) {
    process.stderr.write("Use at least 12 characters.\n");
    process.exit(1);
  }
  process.stdout.write(`${await hashPassword(password)}\n`);
}

void main();
