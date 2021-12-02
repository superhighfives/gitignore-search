import {
  ActionPanel,
  CopyToClipboardAction,
  Icon,
  List,
  OpenInBrowserAction,
  showToast,
  ToastStyle,
} from "@raycast/api";
import { ReactElement, useState, useEffect, StatelessComponent } from "react";
import fetch from "cross-fetch";

const API_URL = "https://www.toptal.com/developers/gitignore/api/list?format=json";
const GITHUB_URL = "https://github.com/toptal/gitignore/blob/master/templates";
const GITIGNORE_URL = "https://gitignore.io";
const EXPORT_URL = "https://www.toptal.com/developers/gitignore/api/";

type GitIgnore = {
  fileName: string;
  key: string;
  contents: string;
  name: string;
  selected: boolean;
};

type SelectedItem = {
  key: string;
};

const state = {
  selectedItems: [],
  languages: []
};

console.log(state);

export default function Main(): ReactElement {
  const [state, setState] = useState<{ files: GitIgnore[], selected: SelectedItem[] }>({ files: [], selected: [] });

  useEffect(() => {
    async function fetch() {
      const files = await fetchData();
      setState((oldState) => ({
        ...oldState,
        files,
      }));
    }
    fetch();
  }, []);

  function handleToggle(key: string) {
    const newState = {...state}

    if(isSelected(key)) {
      
      const index = findSelected(key)
      newState.selected.splice(index, 1)

    } else {
      newState.selected.push({key: key} as SelectedItem)
    }

    setState(newState)
  }

  function isSelected(key:string) {
    return state.selected.some((item:SelectedItem) => item.key === key) ? true : false
  }

  function findSelected(key:string) {
    return state.selected.findIndex((item:SelectedItem) => item.key === key)
  }

  return (
    <List isLoading={state.files.length === 0} searchBarPlaceholder="Filter files by name...">
      {state.selected.length > 0 && (
        <List.Item
          id="export"
          key="export"
          title="Export .gitignore"
          icon={Icon.Download}
          actions={
            <ActionPanel>
              <OpenInBrowserAction url={`${EXPORT_URL}/${state.selected.map(item => item.key).join(',')}`} />
              <CopyToClipboardAction content={`${state.selected.map(item => (state.files[item.key as keyof GitIgnore[]] as GitIgnore).contents).join('')}`} />
            </ActionPanel>
          }
        />
      )}

      {(Object.keys(state.files) as Array<keyof typeof state.files>).sort().map((key) => {
        const gitignore = state.files[key] as GitIgnore;
        return <GitIgnoreListItem key={gitignore.key} gitignore={gitignore} handleToggle={handleToggle} isSelected={isSelected} />;
      })}

      {/* <List.Item
        id="link"
        key="link"
        title="Visit GitIgnore.io"
        icon={Icon.Link}
        actions={
          <ActionPanel>
            <OpenInBrowserAction url={GITIGNORE_URL} />
          </ActionPanel>
        }
      /> */}
    </List>
  );
}

function GitIgnoreListItem(props: { gitignore: GitIgnore, handleToggle: (key: string) => void, isSelected: (key: string) => boolean }) {
  const { gitignore, handleToggle, isSelected } = props;
  return (
    <List.Item
      id={gitignore.key}
      key={gitignore.key}
      title={gitignore.name}
      icon={isSelected(gitignore.key) ? Icon.Checkmark : Icon.Circle}
      accessoryTitle={gitignore.fileName}
      actions={
        <ActionPanel>
          <ToggleSelectedAction gitignore={gitignore} onToggle={() => handleToggle(gitignore.key)} isSelected={isSelected} />
          <CopyToClipboardAction content={gitignore.contents} />
          <OpenInBrowserAction url={`${GITHUB_URL}/${gitignore.fileName}`} />
        </ActionPanel>
      }
    />
  );
}

function ToggleSelectedAction(props: { gitignore: GitIgnore; onToggle: () => void, isSelected: (key: string) => boolean }) {
  const { gitignore, onToggle, isSelected } = props;
  return (
    <ActionPanel.Item
      icon={isSelected(gitignore.key) ? Icon.Checkmark : Icon.Circle}
      title={isSelected(gitignore.key) ? "Remove GitIgnore" : "Add GitIgnore"}
      onAction={onToggle}
    />
  );
}

async function fetchData(): Promise<GitIgnore[]> {
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
