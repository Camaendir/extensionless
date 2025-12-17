import { Plugin, TAbstractFile } from 'obsidian';

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

	overwrite_getLinkpathDest(link: string, source: string){

		var basename = (path: string) => {
            var t = path.lastIndexOf("/");
            return -1 === t ? path : path.slice(t + 1);
		};

		var	dirname = (path: string) => {
			var t = path.lastIndexOf("/");
			return -1 === t ? "" : path.slice(0, t);
		};

		var comparison_function = (file1: TAbstractFile, file2: TAbstractFile) => {
			return file1.path.length - file2.path.length;
		}

		var mygetLinkpathDest = (link:string, sourceFile: string) => {
			if ("" === link && sourceFile && (f = this.app.vault.getAbstractFileByPath(sourceFile)) !== null)
				return [f];
			var workingLink = link.toLowerCase();
			var tmpFileLink = basename(workingLink);

			//@ts-ignore
			var fileResult = this.app.metadataCache.uniqueFileLookup.get(tmpFileLink);
			
			if (!fileResult)
				return [];

			if (tmpFileLink === workingLink && 1 === fileResult.length)
				return fileResult.slice();
			var sourceDirName = dirname(sourceFile).toLowerCase();
			if (workingLink.startsWith("./") || workingLink.startsWith("../")) {
				if (workingLink.startsWith("./../") && (workingLink = workingLink.substr(2)),
				workingLink.startsWith("./"))
					"" !== sourceDirName && (sourceDirName += "/"),
					workingLink = sourceDirName + workingLink.substring(2);
				else {
					for (; workingLink.startsWith("../"); )
						workingLink = workingLink.substr(3),
						sourceDirName = dirname(sourceDirName);
					"" !== sourceDirName && (sourceDirName += "/"),
					workingLink = sourceDirName + workingLink
				}
				for (var a = 0, s = fileResult; a < s.length; a++) {
					if ((m = (f = s[a]).path.toLowerCase()) === workingLink)
						return [f]
				}
			}
			workingLink.startsWith("/") && (workingLink = workingLink.substr(1));
			for (var l = 0, c = fileResult; l < c.length; l++) {
				if ((m = (f = c[l]).path.toLowerCase()) === workingLink)
					return [f]
			}
			if (link.startsWith("/"))
				return [];
			for (var u = [], h = [], p = 0, d = fileResult; p < d.length; p++) {
				var f, m;
				(m = (f = d[p]).path.toLowerCase()).endsWith(workingLink) && (m.startsWith(sourceDirName) ? u.push(f) : h.push(f))
			}
			return u.sort(comparison_function),
			h.sort(comparison_function),
			u.concat(h)
		}


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
				return mygetLinkpathDest(link, source);
			}
			return original_result;

		}else{

			const my_result = mygetLinkpathDest(link, source);

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

		// see above
		//@ts-ignore
		this.app.metadataCache.getLinkpathDest_old = this.app.metadataCache.getLinkpathDest;

		// see above
		//@ts-ignore
		this.app.metadataCache.getLinkpathDest = this.overwrite_getLinkpathDest;
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
