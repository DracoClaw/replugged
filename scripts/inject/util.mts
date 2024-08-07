import { type SpawnOptions, execSync, spawn } from "child_process";
import type { DiscordPlatform, ProcessInfo, UserData } from "./types.mjs";

export const AnsiEscapes = {
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  RED: "\x1b[31m",
};

export const PlatformNames = {
  stable: "Discord",
  ptb: "Discord PTB",
  canary: "Discord Canary",
  dev: "Discord Development",
};

export const getCommand = ({
  action,
  platform,
  prod,
}: {
  action: string;
  platform?: DiscordPlatform;
  prod: boolean;
}): string => {
  let cmd = `pnpm run ${action}`;
  if (prod) cmd += " --production";
  cmd += ` ${platform || `[${Object.keys(PlatformNames).join("|")}]`}`;
  return cmd;
};

export const getProcessInfoByName = (processName: string): ProcessInfo | ProcessInfo[] | null => {
  try {
    const isWindows = process.platform === "win32";
    const command = isWindows
      ? `wmic process where (Name="${processName}.exe") get ProcessId,ParentProcessId /FORMAT:CSV`
      : `ps -eo cmd,ppid,pid | grep -E "(^|/)${processName}(\\s|$)" | grep -v grep`;
    const output = execSync(command).toString();

    if (!output.trim()) {
      return null;
    }

    const lines = output
      .trim()
      .split(isWindows ? "\r\r\n" : "\n")
      .slice(1);
    const processInfo = lines.map((line) => {
      const parts = isWindows ? line.split(",") : line.trim().split(/\s+/);
      return {
        ppid: parseInt(parts[1], 10),
        pid: parseInt(parts[2], 10),
      };
    });

    if (isWindows) {
      const parentPIDs = processInfo.map((process) => process.ppid);
      const mainProcess = processInfo.find((process) => parentPIDs.includes(process.pid));
      return mainProcess || null;
    } else {
      return processInfo || null;
    }
  } catch {
    return null;
  }
};

export const killCheckProcessExists = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

export const killProcessByPID = (pid: number): Promise<void> => {
  return new Promise((resolve) => {
    if (!pid) resolve();
    process.kill(pid, "SIGTERM");
    const checkInterval = setInterval(() => {
      if (!killCheckProcessExists(pid)) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 6000);
  });
};

export const openProcess = (command: string, args?: string[], options?: SpawnOptions): void => {
  void (process.platform === "darwin"
    ? execSync(command)
    : spawn(command, args ?? [], options ?? {}).unref());
};

export const getUserData = (): UserData => {
  const name = execSync("logname", { encoding: "utf8" }).toString().trim().replace(/\n$/, "");
  const env = Object.assign({}, process.env, { HOME: `/home/${name}` });
  const uid = execSync(`id -u ${name}`, { encoding: "utf8" }).toString().trim().replace(/\n$/, "");
  const gid = execSync(`id -g ${name}`, { encoding: "utf8" }).toString().trim().replace(/\n$/, "");
  return { env, uid: Number(uid), gid: Number(gid) };
};
