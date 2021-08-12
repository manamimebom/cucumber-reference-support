import * as vscode from 'vscode';
import * as bdd_funcs from './bdd_funcs';

import { RefItemProvider} from './RefsExplorer';

export var refsProv = new RefItemProvider();

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('cucumber-reference-support.findAllReferences', () => {
		bdd_funcs.find_references().then( results =>{	
			init_refs_explorer();
			if (results !== undefined){refsProv.results = results;}
		}); 
	});

	vscode.window.registerTreeDataProvider('bdd_refs', refsProv);
	refsProv.view = vscode.window.createTreeView("bdd_refs", {treeDataProvider: refsProv, showCollapseAll: true});

	context.subscriptions.push(disposable);
}

function init_refs_explorer(){
	refsProv.coms.forEach(element => { element.dispose();});
	
	refsProv = new RefItemProvider();
	vscode.window.registerTreeDataProvider('bdd_refs', refsProv);
	refsProv.view = vscode.window.createTreeView("bdd_refs", {treeDataProvider: refsProv, showCollapseAll: true});

	// Refs Explorer TreeView Commands
	refsProv.coms.push(vscode.commands.registerCommand('bdd.go2Reference', (item) => {
		refsProv.go2Reference(item);
	}));

}

// this method is called when your extension is deactivated
export function deactivate() {}
