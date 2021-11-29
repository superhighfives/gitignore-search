import {
  ActionPanel,
  CopyToClipboardAction,
  Icon,
  List,
  OpenInBrowserAction,
  showToast,
  ToastStyle,
} from "@raycast/api";
import { useState, useEffect } from "react";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const GITHUB_URL = "https://github.com/github/gitignore";
const FETCH_URL = "https://gitignore-store.superhighfives.workers.dev";

export default function GitIgnoreList() {
  const [state, setState] = useState<{ files: GitIgnore[] }>({ files: [] });

  useEffect(() => {
    async function fetchOutput() {
      const files = await fetchFiles();
      setState((oldState) => ({
        ...oldState,
        files: files.filter((file) => path.parse(file.path).ext === ".gitignore"),
      }));
    }
    fetchOutput();
  }, []);

  return (
    <List isLoading={state.files.length === 0} searchBarPlaceholder="Filter files by name...">
      <List.Item
        id="link"
        key="link"
        title="View Gitignore repository"
        icon={Icon.Link}
        actions={
          <ActionPanel>
            <OpenInBrowserAction url={GITHUB_URL} />
          </ActionPanel>
        }
      />

      {state.files.map((gitignore) => (
        <GitIgnoreListItem key={gitignore.sha} gitignore={gitignore} />
      ))}
    </List>
  );
}

function GitIgnoreListItem(props: { gitignore: GitIgnore }) {
  const [state, setState] = useState<Record<string, string>>({});

  const gitignore = props.gitignore;
  const contentPath = `${FETCH_URL}/${gitignore.path}`;

  useEffect(() => {
    async function fetchOutput() {
      const response = await fetch(contentPath);
      const text = await response.text();
      setState((oldState) => ({
        ...oldState,
        [gitignore.path]: text
      }));
    }
    fetchOutput();
  }, []);

  return (
    <List.Item
      id={gitignore.sha}
      key={gitignore.sha}
      title={gitignore.name.replace(".gitignore", "")}
      icon={Icon.Document}
      accessoryTitle={gitignore.name}
      actions={
        <ActionPanel>
            <CopyToClipboardAction
              content={state[gitignore.path]}
            />
          <OpenInBrowserAction url={gitignore.download_url} />
        </ActionPanel>
      }
    />
  );
}

async function fetchFiles(): Promise<GitIgnore[]> {
  try {
    const response = await fetch(FETCH_URL);
    const json = await response.json();
    return json as Record<string, unknown> as unknown as GitIgnore[];
  } catch (error) {
    console.error(error);
    showToast(ToastStyle.Failure, "Could not load gitignore files");
    return Promise.resolve([]);
  }
}

type GitIgnore = {
  sha: string;
  name: string;
  path: string;
  download_url: string;
  type: string;
};
