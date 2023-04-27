import { render } from 'preact';
import '../base.css';
import { getUserConfig, UserConfig } from '../config';
import ChatGPTCard from './ChatGPTCard';
import { config } from './search-engine-configs';
import { getPossibleElementByQuerySelector } from './utils';

const siteRegex = 'colab'; //new RegExp(Object.keys(config).join('|'))

export function insertAfter(newNode: Element, referenceNode: Element) {
  (referenceNode.parentNode as Element).insertBefore(newNode, referenceNode.nextSibling);
}

async function mount(parentContainer: Element, userConfig: UserConfig, numberId: string) {
  const siteName = location.hostname.match(siteRegex)![0];
  const siteConfig = config[siteName];
  const inputCell = getPossibleElementByQuerySelector(siteConfig.cellQuery, parentContainer)[0] as HTMLTextAreaElement;

  const chatGptButton = document.createElement('button');

  let container: Element;

  chatGptButton.innerText = 'ChatGPT';

  chatGptButton.className = 'show-ChatGPT';

  chatGptButton.id = numberId;

  chatGptButton.classList.add('chatgpt-button', 'add-code', 'add-button');

  chatGptButton.addEventListener('click', () => {
    if (container) {
      container.remove();
    }

    container = document.createElement('div');

    container.classList.add('decode-container');
    inputCell?.appendChild(container);
    insertAfter(container, inputCell);

    const codeBlocks = getPossibleElementByQuerySelector( ['.codecell-input-output']) ?? [];
    const items = [...codeBlocks];
    let preCode = '';

    const currentId = getPossibleElementByQuerySelector(['.show-ChatGPT'], parentContainer)[0].id;

    let i = 1;
    items.forEach((item) => {
    const id = getPossibleElementByQuerySelector(['.show-ChatGPT'], item)[0].id;
    const inputCell = getPossibleElementByQuerySelector(['.inputarea'], item)[0] as HTMLTextAreaElement;
    if(i == 1){
      preCode = preCode + '\n' + inputCell.innerText;
    }
    if(id == currentId){
      i = 0;
    }
  });

    render(<ChatGPTCard question={inputCell.innerText} userConfig={userConfig} preCode={preCode}/>, container);
  });

  insertAfter(chatGptButton, inputCell);

  parentContainer.addEventListener('mouseenter', () => {
    chatGptButton.style.position = 'absolute';
    chatGptButton.style.visibility = 'visible';
  });

  parentContainer.addEventListener('mouseleave', () => {
    chatGptButton.style.visibility = 'hidden';
  });
}

async function run() {
  if (!window.location.href.includes('colab.research.google.com')) {
    return;
  }

  const siteName = location.hostname.match(siteRegex)![0];
  const siteConfig = config[siteName];

  const codeBlocks = getPossibleElementByQuerySelector(siteConfig.codeBlocksQuery) ?? [];

  const userConfig = await getUserConfig();

  const items = [...codeBlocks];

  let id = 1;

  items.forEach((item) => {
    let numberid = ''+id;
    mount(item, userConfig,numberid);
    id = id + 1;
  });

  // attach chatgpt to newly added code cells.
  const targetNode = document.body;
  const nodeConfig = { childList: true, subtree: true };
  const observer = new MutationObserver(function (mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const newlyAddedCodeBlocks =
              getPossibleElementByQuerySelector(siteConfig.codeBlocksQuery, node as Element) ?? [];
            Array.from(newlyAddedCodeBlocks).forEach(function (item) {
              let numberid = ''+id;
              mount(item, userConfig, numberid);
              id = id + 1;
            });
          }
        }
      }
    }
  });
  observer.observe(targetNode, nodeConfig);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => run(), 0);
  });
} else {
  setTimeout(() => run(), 0);
}
