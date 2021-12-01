import {
  ActionPanel,
  CopyToClipboardAction,
  Icon,
  List,
  OpenInBrowserAction,
  showToast,
  ToastStyle,
  environment,
} from "@raycast/api";
import { useState, useEffect } from "react";
import fetch from "cross-fetch";

const API_URL = "https://www.toptal.com/developers/gitignore/api/list?format=json";
const GITHUB_URL = "https://github.com/toptal/gitignore/blob/master/templates"

const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>

export default function GitIgnoreList() {
  const [state, setState] = useState<{ files: GitIgnore[] }>({ files: [] });

  useEffect(() => {
    async function fetch() {
      const files = await fetchFiles();
      setState((oldState) => ({
        ...oldState,
        files
      }));
    }
    fetch();
  }, []);

  return (
    <List isLoading={state.files.length === 0} searchBarPlaceholder="Filter files by name...">
      <List.Item
        id="link"
        key="link"
        title="Visit GitIgnore.io"
        icon={Icon.Link}
        actions={
          <ActionPanel>
            <OpenInBrowserAction url={"https://gitignore.io"} />
          </ActionPanel>
        }
      />

      {(Object.keys(state.files) as Array<keyof typeof state.files>).sort().map((key) => {
        const gitignore = state.files[key] as GitIgnore
        return <GitIgnoreListItem key={gitignore.key} gitignore={gitignore} />
      })}
    </List>
  );
}

function GitIgnoreListItem(props: { gitignore: GitIgnore }) {
  const gitignore = props.gitignore;
  return (
    <List.Item
      id={gitignore.key}
      key={gitignore.key}
      title={gitignore.name}
      icon={Icon.Document}
      accessoryTitle={gitignore.fileName}
      actions={
        <ActionPanel>
          <CopyToClipboardAction
            content={gitignore.contents}
          />
          <OpenInBrowserAction url={`${GITHUB_URL}/${gitignore.fileName}`} />
        </ActionPanel>
      }
    />
  );
}

async function fetchFiles(): Promise<GitIgnore[]> {
  try {
    const response = await fetch(API_URL);
    const json = await response.json();
    return json as Record<string, unknown> as unknown as GitIgnore[];
  } catch (error) {
    console.error(error);
    showToast(ToastStyle.Failure, "Could not load gitignore files");
    return Promise.resolve([]);
  }
}

type GitIgnore = {
  fileName: string;
  key: string;
  contents: string;
  name: string;
};