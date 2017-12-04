const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;




const ProfileSwitcher = new Lang.Class({
    Name: 'ProfileSwitcher',

    _init: function() {
        let output,match
        // possible states and their text representation.
        this._stateList = [];
        output = GLib.spawn_command_line_sync("/usr/sbin/tuned-adm list")[1].toString().split("\n");
        for(var line in output){
            match = /- (\S+)\s+/.exec(output[line]);
            if(match){
                this._stateList.push(match[1]);
            }
        }

        this.find_active();

        // make the menu
        this._switcherMenu = new PopupMenu.PopupSubMenuMenuItem(
            "Profile", true);
        this._switcherMenu.icon.icon_name =
            "preferences-system-power-management";

        // add items for each state.
        this._items = {};
        for (var i = 0; i < this._stateList.length; i++) {
            let state = this._stateList[i];
            let item = new PopupMenu.PopupMenuItem(state);
            this._switcherMenu.menu.addMenuItem(item);
            item.connect("activate", Lang.bind(this, function(){
                Util.spawn(["/usr/sbin/tuned-adm", "profile", state]);
                load_settings_refresh();
            }));
            this._items[state] = item;
        }

        let index = 8;
        Main.panel.statusArea.aggregateMenu.menu.addMenuItem(
            this._switcherMenu, index);

        // Register callback for changes to the settings
        let load_settings_refresh = Lang.bind(this, function() {
            this.refresh();
        });
        load_settings_refresh();
    },

    find_active: function() {
        output = GLib.spawn_command_line_sync("/usr/sbin/tuned-adm active")[1].toString();
        match = /Current active profile: (\S+)/.exec(output);
        if(match){
            this._mode = match[1];
        }else{
            throw "No active profile found!"
        }
    },

    refresh: function() {
        this.find_active();
        this._switcherMenu.label.text =
            "Profile: " + this._mode;

        for (var state in this._items) {
            this._items[state].setOrnament((this._mode == state));
        }
    },

    destroy: function() {
        this._switcherMenu.destroy();
    }

});


let profileSwitcher;

function enable() {
    profileSwitcher = new ProfileSwitcher();
}

function disable() {
    if(profileSwitcher != null) {
        profileSwitcher.destroy();
        profileSwitcher = null;
    }
}
