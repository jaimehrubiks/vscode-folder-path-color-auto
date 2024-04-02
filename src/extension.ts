import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs'
import * as crypto from 'crypto'

const colorMap: Record<string, string> = {
  blue: 'terminal.ansiBlue',
  magenta: 'terminal.ansiBrightMagenta',
  red: 'terminal.ansiBrightRed',
  cyan: 'terminal.ansiBrightCyan',
  green: 'terminal.ansiBrightGreen',
  yellow: 'terminal.ansiBrightYellow',
};

class ColorDecorationProvider implements vscode.FileDecorationProvider {
  private readonly _onDidChangeFileDecorations: vscode.EventEmitter<
    vscode.Uri | vscode.Uri[] | undefined
  > = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  public readonly onDidChangeFileDecorations: vscode.Event<
    vscode.Uri | vscode.Uri[] | undefined
  > = this._onDidChangeFileDecorations.event;
  private folders: {
    path: string;
    color: string;
    symbol?: string;
    tooltip?: string;
  }[] = [];
  private jaime = vscode.window.createOutputChannel("Jaime");

  constructFolders() {
    this.jaime.appendLine('constructing files');
    this.folders = [];
    const config = vscode.workspace.getConfiguration('folder-path-color');
    const folders: {
      path: string;
      color?: string;
      symbol?: string;
      tooltip?: string;
    }[] = config.get('folders') || [];
    const colors = Object.keys(colorMap).filter(
      (color) => !folders.find((folder) => folder.color === color)
    );
    let i = 0;
    for (const folder of folders) {
      if (!Object.keys(colorMap)[i]) {
        i = 0;
      }
      this.folders.push({
        path: folder.path,
        color: folder.color || colors[i] || Object.keys(colorMap)[i],
        symbol: folder.symbol,
        tooltip: folder.tooltip,
      });
      i++;
    }

    if (vscode.workspace.workspaceFolders){
      vscode.workspace.workspaceFolders.forEach(workspaceFolder => {
        this.jaime.appendLine('workspace folder: ' + JSON.stringify(workspaceFolder.uri.path))
        this.fetchAllGitRepos(workspaceFolder.uri.path).forEach(dir=>{
          const localPath = dir.replace('/.git','').replace(workspaceFolder.uri.path + '/', '');
          const localPathHash = this.generateHash(localPath)
          const localPathHashDecimal = parseInt(localPathHash, 16);

          const colorIndex = localPathHashDecimal % Object.keys(colorMap).length
          const emojiIndex = this.decimalToEmoji(localPathHashDecimal)

          this.folders.push({
            path: localPath,
            color: Object.keys(colorMap)[ colorIndex ],
            symbol: emojiIndex,
          })
        })
      })
    }
    
    this.jaime.appendLine(JSON.stringify(this.folders))
  }

  decimalToEmoji(decimal: number) {
    const emojis = ["🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🚚","🚛","🚜","🚲","🛴","🛵","🚏","🛣️","🛤️","⛵","🛶","🚤","🛳️","⛴️","🛥️","🚢","✈️","🛩️","🛫","🛬","🚁","🚟","🚠","🚡","🛰️","🚀","🛸⚽","⚾","🏀","🏐","🏈","🏉","🎾","🎳","🏏","🏑","🥎","🏒","🏓","🏸","🥊","🥋","🥏","🥅","⛸️","🎣","🥍","🎿","🛷","🥌","🎯","🎱","🧿","🧩","🧸","🧵","🧶📢","📣","📯","🔔","🎼","🎵","🎶","🎙️","🎚️","🎛️","🎧","📻","🎷","🎸","🎹","🎺","🎻","🥁","💽","💿","📀","🎥","🎞️","📽️","🎬","📺","📷","📸","📹","📼🥭","🍇","🍈","🍉","🍊","🍋","🍌","🍍","🍎","🍏","🍐","🍑","🍒","🥬","🍓","🥝","🍅","🥥","🥑","🍆","🥔","🥕","🌽","🌶️","🥯","🥒","🥦","🥜","🌰","🍞","🥐","🥖","🥨","🥞","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🥙","🥚","🧂","🍳","🥘","🍲","🥣","🥗","🍿","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🥮","🍝","🍠","🍢","🍣","🍤","🍥","🍡","🥟","🥠","🥡","🍦","🍧","🍨","🍩","🍪","🧁","🎂","🍰","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🍵","🍶","🍾","🍷","🍸","🍹","🍺","🍻","🥂","🥃","🥤","🥢","🍽️","🍴","🥄","🏺🙈","🙉","🦝","🐵","🐒","🦍","🐶","🐕","🐩","🐺","🦊","🐱","🐈","🦁","🐯","🐅","🐆","🐴","🐎","🦄","🦓","🦌","🐮","🦙","🐂","🐃","🐄","🐷","🦛","🐖","🐗","🐽","🐏","🐑","🐐","🐪","🐫","🦒","🐘","🦏","🐭","🐁","🐀","🦘","🐹","🦡","🐰","🐇","🐿️","🦔","🦇","🐻","🐨","🐼","🐾","🦃","🐔","🦢","🐓","🐣","🐤","🦚","🐥","🐦","🦜","🐧","🕊️","🦅","🦆","🦉","🐸","🐊","🐢","🦎","🐍","🐲","🐉","🦕","🦖","🐳","🐋","🐬","🐟","🐠","🐡","🦈","🐙","🐚","🦀","🦟","🦐","🦑","🦠","🐌","🦋","🐛","🐜","🐝","🐞","🦗","🕷️","🕸️","🦂","🦞🌸","💮","🏵️","🌹","🥀","🌺","🌻","🌼","🌷","🌱","🌲","🌳","🌴","🌵","🌾","🌿","☘️","🍀","🍁","🍂","🍃","🍄⌛","⏳","⚡","🎆","🎇","🔇","🔈","🔉","🔊","🔕","🔒","🔓","🔏","🔐","🚮","🚰","♿","🚹","🚺","🚻","🚼","🚾","🛂","🛃","🛄","🛅","⚠️","🚸","⛔","🚫","🚳","🚭","🚯","🚱","🚷","📵","🔞","⏭️","⏯️","⏮️","⏸️","⏹️","⏺️","⏏️","🎦","🔅","🔆","📶","📳","📴","🔱","ℹ️","Ⓜ️","🅿️🦷","🦴","🛀","👣","💣","🔪","🧱","🛢️","⛽","🛹","🚥","🚦","🚧","🛎️","🧳","⛱️","🔥","🧨","🎗️","🎟️","🎫","🧧","🔮","🎲","🎴","🎭","🖼️","🎨","🎤","🔍","🔎","🕯️","💡","🔦","🏮","📜","🧮","🔑","🗝️","🔨","⛏️","⚒️","🛠️","🗡️","⚔️","🔫","🏹","🛡️","🔧","🔩","⚙️","🗜️","⚖️","⛓️","⚗️","🔬","🔭","📡","💉","💊","🚪","🛏️","🛋️","🚽","🚿","🛁","🛒","🚬","⚰️","⚱️","🧰","🧲","🧪","🧴","🧷","🧹","🧻","🧼","🧽","🧯","💠","♟️💺","🎮","🕹️","🎰","📱","📲","☎️","📞","📟","📠","💻","🖥️","🖨️","⌨️","🖱️","🖲️","💾","📔","📕","📖","📗","📘","📙","📚","📓","📒","📃","📄","📰","🗞️","📑","🔖","🏷️","💰","💴","💵","💶","💷","💸","💳","💹","💱","✉️","📧","📨","📩","📤","📥","📦","📫","📪","📬","📭","📮","🗳️","✏️","✒️","🖋️","🖊️","🖌️","🖍️","📝","💼","📁","📂","🗂️","📅","📆","🗒️","🗓️","📇","📈","📉","📊","📋","📌","📍","📎","🖇️","📏","📐","✂️","🗃️","🗄️","🗑️","🧾🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🚚","🚛","🚜","🚲","🛴","🛵","🚏","🛣️","🛤️","⛵","🛶","🚤","🛳️","⛴️","🛥️","🚢","✈️","🛩️","🛫","🛬","🚁","🚟","🚠","🚡","🛰️","🚀","🛸🌍","🌎","🌏","🌐","🗺️","🗾","🏔️","⛰️","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","🗼","🗽","⛪","🕌","🕍","⛩️","🕋","⛲","⛺","🏙️","🎠","🎡","🎢","🎪","⛳","🗿💦","🌋","🌁","🌃","🌄","🌅","🌆","🌇","🌉","🌌","🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🌙","🌚","🌛","🌜","🌡️","☀️","🌝","🌞","🌟","🌠","☁️","⛅","⛈️","🌤️","🌥️","🌦️","🌧️","🌨️","🌩️","🌪️","🌫️","🌬️","🌀","🌈","☔","❄️","☃️","⛄","☄️","💧","🌊","🎑💢","♨️","💈","⚓","♠️","♥️","♦️","♣️","💲","☢️","☣️","🛐","⚛️","🕉️","✡️","☸️","☯️","✝️","☦️","☪️","☮️","🕎","🔯","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⛎","♀️","♂️","⚕️","♻️","⚜️","©️","®️","♾️👁️‍🗨️","💤","💥","💨","💫","💬","🗨️","🗯️","💭","🕳️","🚨","🛑","⭐","🎃","🎄","✨","🎈","🎉","🎊","🎋","🎍","🎎","🎏","🎐","🎀","🎁","🃏","🀄","🔋","🔌","🔗","🧫","🧬","📛","⭕","✅","☑️","✔️","✖️","❌","❎","➕","➖","➗","➰","➿","〽️","✳️","✴️","❇️","〰️","🔴","🔵","⚪","⚫","⬜","⬛","◼️","◻️","◽","◾","▫️","▪️","🔶","🔷","🔸","🔹","🔺","🔻","🔘","🔲","🔳"]
    return emojis[decimal % emojis.length]
  }

  generateHash(input: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
    // return parseInt(hexHash, 16);
  }

  fetchAllGitRepos = (fullPath : string) => {
    let files : string[] = [];
    fs.readdirSync(fullPath).forEach(file => {
      const absolutePath = path.join(fullPath, file);
        if (fs.statSync(absolutePath).isDirectory()) {
          if (absolutePath.endsWith('.git')){
            this.jaime.appendLine('detected git:' + absolutePath)
            files.push(absolutePath);
          }
          else{
            const filesFromNestedFolder = this.fetchAllGitRepos(absolutePath);
            filesFromNestedFolder.forEach(file => {
              files.push(file);
            })
          }
        }
    });
    return files
}

  constructor() {
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('folder-path-color.folders')) {
        this.constructFolders();
        this._onDidChangeFileDecorations.fire(undefined);
      }
    });
    this.constructFolders();
  }

  provideFileDecoration(
    uri: vscode.Uri,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.FileDecoration> {
    const normalizedUriPath = uri.path.replace(/\\/g, '/');
    if (vscode.workspace.workspaceFolders) {
      const workspacePaths = vscode.workspace.workspaceFolders.map(
        (folder) => folder.uri.path
      );

      let i = 0;
      for (const folder of this.folders) {
        let colorId = colorMap[folder.color];

        const pathIsInConfig = workspacePaths.find((root) => {
          const normalizedFolderPath = path.join(root, folder.path).replace(/\\/g, '/');
          return normalizedUriPath.includes(normalizedFolderPath);
        });

        if (pathIsInConfig) {
          return new vscode.FileDecoration(
            folder.symbol,
            folder.tooltip,
            new vscode.ThemeColor(colorId)
          );
        }
        i++;
      }
    }

    return undefined;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorDecorationProvider();
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(provider)
  );
}
