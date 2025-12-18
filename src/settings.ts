import { App, PluginSettingTab, Setting } from "obsidian";
import ExtensionlessPlugin from "./main";

export interface ExtensionlessSettings {
    enable: boolean;
    markdownFirst: boolean;
}

export const DEFAULT_SETTINGS: ExtensionlessSettings = {
    enable: true,
    markdownFirst: true
}

export class ExtensionlessSettingsTab extends PluginSettingTab {
    plugin: ExtensionlessPlugin;

    constructor(app: App, plugin: ExtensionlessPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl).setName('Extensionless plugin').setHeading();

        new Setting(containerEl)
            .setName('Enable extensionless links')
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
            .setName('Find markdown first')
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