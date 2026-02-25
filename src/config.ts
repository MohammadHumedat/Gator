import { rawListeners } from "cluster";
import fs from "fs";
import os from "os";
import path from "path";
import { config } from "process";
import { json } from "stream/consumers";

const configFile = ".gatorconfig.json";

export interface Config {
  dbUrl: string;
  currentUserName?: string;
}

function getConfigFilePath(): string {
  // function to fetch the path in home directory
  return path.join(os.homedir(), configFile);
}

function writeConfig(cfg: Config): void {
  // helper function to write in the file
  const filePath = getConfigFilePath();
  const data = JSON.stringify(
    {
      db_url: cfg.dbUrl,
      current_user_name: cfg.currentUserName,
    },
    null,
    2,
  );
  fs.writeFileSync(filePath, data, "utf-8");
}

function validateConfig(rawConfig: any): Config {
  // helper function to validate the data
  if (!rawConfig.db_url) {
    throw new Error("Invallid data");
  }
  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}
export function readConfig(): Config {
  const filePath = getConfigFilePath();
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const rawConfig = JSON.parse(fileContent);
    return validateConfig(rawConfig);
  } catch (error) {
    throw new Error(`Could not read config file: ${error}`);
  }
}
export function setUser(userName: string): void {
  const config = readConfig();
  config.currentUserName = userName;
  writeConfig(config);
}
