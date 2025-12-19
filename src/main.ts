import { Plugin, TAbstractFile } from 'obsidian';
import { DEFAULT_SETTINGS, ExtensionlessSettings, ExtensionlessSettingsTab } from './settings';

/*
 * There are some @ts-ignore in this file.
 * This is because this plugin accesses function of the MetadataCache, that are not defined in the typescript annotations.
 */

export default class ExtensionlessPlugin extends Plugin {
	settings: ExtensionlessSettings;

	basename(path: string) {
		const t = path.lastIndexOf("/");
		return -1 === t ? path : path.slice(t + 1);
	}

	dirname(path: string) {
		const t = path.lastIndexOf("/");
		return -1 === t ? "" : path.slice(0, t);
	}

	mygetLinkpathDest(link:string, sourceFile: string) {
		let f;
		if ("" === link && sourceFile && (f = this.app.vault.getAbstractFileByPath(sourceFile)) !== null)
			return [f];
		let workingLink = link.toLowerCase();
		const tmpFileLink = this.basename(workingLink);

		// see above
		//@ts-ignore
		const fileResult = this.app.metadataCache.uniqueFileLookup.get(tmpFileLink);
		
		if (!fileResult)
			return [];

		if (tmpFileLink === workingLink && 1 === fileResult.length)
			return fileResult.slice();
		let sourceDirName = this.dirname(sourceFile).toLowerCase();
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
				if ((f = s[a]).path.toLowerCase() === workingLink)
					return [f]
			}
		}
		if (!workingLink.startsWith("/")){
			workingLink = workingLink.slice(1);
		}
		let l = 0, c = fileResult
		for (; l < c.length; l++) {
			if ((f = c[l]).path.toLowerCase() === workingLink)
				return [f]
		}
		if (link.startsWith("/"))
			return [];
		let u = [], h = [], p = 0, d = fileResult;
		for (; p < d.length; p++) {
			let f  = d[p]
			let m  = f.path.toLowerCase()
			if (!m.endsWith(workingLink)) {
				if (m.startsWith(sourceDirName)){
					u.push(f);
				}else{
					h.push(f);
				}
			}
		}

		const comparison_function = (file1: TAbstractFile, file2: TAbstractFile) => {
			return file1.path.length - file2.path.length;
		}

		return u.sort(comparison_function),
		h.sort(comparison_function),
		u.concat(h)
	}

	overwrite_getLinkpathDest(link: string, source: string){

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

