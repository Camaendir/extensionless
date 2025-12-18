import { App, Plugin, PluginSettingTab, Setting, TAbstractFile } from 'obsidian';

interface ExtensionlessSettings {
	enable: boolean;
	markdownFirst: boolean;
}

const DEFAULT_SETTINGS: ExtensionlessSettings = {
	enable: true,
	markdownFirst: true
}


export default class ExtensionlessPlugin extends Plugin {
	settings: ExtensionlessSettings = DEFAULT_SETTINGS;

	basename(path: string) {
		const t = path.lastIndexOf("/");
		return -1 === t ? path : path.slice(t + 1);
	}

	dirname(path: string) {
		const t = path.lastIndexOf("/");
		return -1 === t ? "" : path.slice(0, t);
	}

	comparison_function(file1: TAbstractFile, file2: TAbstractFile) {
		return file1.path.length - file2.path.length;
	}

	mygetLinkpathDest(link:string, sourceFile: string) {
		let f;
		if ("" === link && sourceFile && (f = this.app.vault.getAbstractFileByPath(sourceFile)) !== null)
			return [f];
		let workingLink = link.toLowerCase();
		const tmpFileLink = this.basename(workingLink);

		//@ts-ignore
		const fileResult = this.app.metadataCache.uniqueFileLookup.get(tmpFileLink);
		
		if (!fileResult)
			return [];

		if (tmpFileLink === workingLink && 1 === fileResult.length)
			return fileResult.slice();
		let sourceDirName = this.dirname(sourceFile).toLowerCase();
		let m;
		if (workingLink.startsWith("./") || workingLink.startsWith("../")) {
			if (workingLink.startsWith("./../") && (workingLink = workingLink.slice(2)), workingLink.startsWith("./")){
				if ("" === sourceDirName) {
					sourceDirName += "/"
				}
				workingLink = sourceDirName + workingLink.substring(2);
			}
				
			else {
				for (; workingLink.startsWith("../"); ){
					workingLink = workingLink.slice(3);
					sourceDirName = this.dirname(sourceDirName);
				}
				if ("" === sourceDirName){
					sourceDirName += "/";
				}
				workingLink = sourceDirName + workingLink;
			}
			let a = 0, s = fileResult;
			for (; a < s.length; a++) {
				if ((m = (f = s[a]).path.toLowerCase()) === workingLink)
					return [f]
			}
		}
		if (!workingLink.startsWith("/")){
			workingLink = workingLink.slice(1);
		}
		let l = 0, c = fileResult
		for (; l < c.length; l++) {
			if ((m = (f = c[l]).path.toLowerCase()) === workingLink)
				return [f]
		}
		if (link.startsWith("/"))
			return [];
		let u = [], h = [], p = 0, d = fileResult;
		for (; p < d.length; p++) {
			let f  = d[p]
			let m  = f.path.toLowerCase()
			if (!m.endsWith(workingLink)) {
				m.startsWith(sourceDirName) ? u.push(f) : h.push(f)
			}
		}
		return u.sort(this.comparison_function),
		h.sort(this.comparison_function),
		u.concat(h)
	}

	overwrite_getLinkpathDest(link: string, source: string){

		if (this.settings === undefined){
			this.settings = DEFAULT_SETTINGS;
		}

		if (!this.settings.enable){
			//@ts-ignore
			return this.app.metadataCache.getLinkpathDest_old(link, source);
		}

		if (this.settings.markdownFirst){

			// see above
			//@ts-ignore
			const original_result = this.app.metadataCache.getLinkpathDest_old(link, source);

			if (!Array.isArray(original_result) || original_result.length == 0){
				return this.mygetLinkpathDest(link, source);
			}
			return original_result;

		}else{

			const my_result = this.mygetLinkpathDest(link, source);

			if (!Array.isArray(my_result) || my_result.length == 0){
				// see above
				//@ts-ignore
				return this.app.metadataCache.getLinkpathDest_old(link, source);
			}
			return my_result;

		}
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ExtensionlessSettingsTab(this.app, this));

		// see above
		//@ts-ignore
		this.app.metadataCache.getLinkpathDest_old = this.app.metadataCache.getLinkpathDest;

		// see above
		//@ts-ignore
		this.app.metadataCache.getLinkpathDest = this.overwrite_getLinkpathDest.bind(this);
	}

	onunload() {
		// see above
		//@ts-ignore
		this.app.metadataCache.getLinkpathDest = this.app.metadataCache.getLinkpathDest_old
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ExtensionlessSettingsTab extends PluginSettingTab {
    plugin: ExtensionlessPlugin;

    constructor(app: App, plugin: ExtensionlessPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        const header = containerEl.createEl('h2', {
            text: 'Extensionless Settings'
        });

        new Setting(containerEl)
            .setName('Enable Extensionless Links')
            .setDesc('Enable or disable the link resolver overwrite.')
            .addToggle(toggle => 
                toggle
                    .setValue(this.plugin.settings.enable)
                    .onChange(async (value) => {
                        this.plugin.settings.enable = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Find Markdown First')
            .setDesc('Set if an extensionless link should search for a markdown file first. This is typically faster for normal links, but you cannot create a link to an extensionless file when there is a markdown file with the same name in the same folder. Requires reload to fully take effect.')
            .addToggle(toggle => 
                toggle
                    .setValue(this.plugin.settings.markdownFirst)
                    .onChange(async (value) => {
                        this.plugin.settings.markdownFirst = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}