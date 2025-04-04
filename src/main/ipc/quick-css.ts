import { ipcMain, shell } from "electron";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { CONFIG_PATHS } from "src/util.mjs";
import { RepluggedIpcChannels } from "../../types";

const CSS_PATH = join(CONFIG_PATHS.quickcss, "main.css");

ipcMain.handle(RepluggedIpcChannels.GET_QUICK_CSS, () =>
  readFile(CSS_PATH, { encoding: "utf-8" }).catch(() => ""),
);
ipcMain.on(RepluggedIpcChannels.SAVE_QUICK_CSS, (_, css: string) =>
  writeFile(CSS_PATH, css, { encoding: "utf-8" }),
);
ipcMain.on(RepluggedIpcChannels.OPEN_QUICKCSS_FOLDER, () => shell.openPath(CONFIG_PATHS.quickcss));
