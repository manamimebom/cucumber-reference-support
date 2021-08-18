import * as vscode from 'vscode';
import * as bdd_funcs from './bdd_funcs';

import { RefItemProvider} from './RefsExplorer';

export var refsProv = new RefItemProvider();

export function activate(context: vscode.ExtensionContext) {

	vscode.commands.registerCommand('bdd.findAllReferences', () => {
		try {
			bdd_funcs.find_references().then( results =>{	
				init_refs_explorer();
				if (results !== undefined){refsProv.results = results;}
			}); 
		  } catch (err) {
			vscode.window.showErrorMessage(err);
		  }		
	});

	vscode.commands.registerCommand('bdd.go2Reference', (item) => {
		try {
			refsProv.go2Reference(item);
		  } catch (err) {
			vscode.window.showErrorMessage(err);
		  }	
	});

	vscode.window.registerTreeDataProvider('bdd_refs', refsProv);
	refsProv.view = vscode.window.createTreeView("bdd_refs", {treeDataProvider: refsProv, showCollapseAll: true});

}

function init_refs_explorer(){
	refsProv.coms.forEach(element => { element.dispose();});
	
	refsProv = new RefItemProvider();
	vscode.window.registerTreeDataProvider('bdd_refs', refsProv);
	refsProv.view = vscode.window.createTreeView("bdd_refs", {treeDataProvider: refsProv, showCollapseAll: true});

	

}

// this method is called when your extension is deactivated
export function deactivate() {}
