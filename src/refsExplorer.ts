import * as vscode from 'vscode';
import * as fs from 'fs';
import { isUndefined } from 'util';
import { promises } from 'dns';
import * as bdd_funcs from './bdd_funcs';

export class RefItemProvider implements vscode.TreeDataProvider<Reftem> {
	private _items: Reftem[] = [];
	private _onDidChangeTreeData: vscode.EventEmitter<Reftem | undefined> = new vscode.EventEmitter<Reftem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Reftem | undefined> = this._onDidChangeTreeData.event;
	public view: vscode.TreeView<Reftem> |undefined;
    public coms: vscode.Disposable[] =[];
    public results: bdd_funcs.Record[] = [];
	public resultsGroup: { [index: string]: Reftem[]; }  = {};
	constructor() {
	}

	getParent(element: Reftem){
		return element;
	}

	refresh(){

	}

	public go2Reference(item: Reftem){
		bdd_funcs.show_doc(item.record.file.fsPath).then( te => {
			bdd_funcs.select_focus_line(te, item.record.line, 2);
		});
    }
	refreshItem(item: Reftem): void {
		this._onDidChangeTreeData.fire(item);
	}

	getTreeItem(element: Reftem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Reftem): Thenable<Reftem[]> {
		return Promise.resolve(this.getRefItems(element));
	}

	private getRefItems(element?: Reftem): Thenable<Reftem[]> {
		var childs: Reftem[] = [];
		if(isUndefined(element)){
			var tmp: { [index: string]: Reftem[]; }  = {};
			this.results.forEach(rec => {
				var key = rec.file.path;
				key = key.split(/[\/]+/).reverse()[0];
				var item = new Reftem(rec.text, vscode.TreeItemCollapsibleState.None,
					 rec, itemTypes.step);
				if (!(key in tmp)){
					tmp[key] = [];
				}
				if (!(key in this.resultsGroup)){
					this.resultsGroup[key] = [];
				}
				tmp[key].push(item);
				this.resultsGroup[key].push(item);
			});
			for (let key in tmp) {				
				var label = key.split(/[\/]+/).reverse()[0];
				var rec = new bdd_funcs.Record();
				rec.file = tmp[key][0].record.file;
				rec.line = 0;

				var item = new Reftem(label, vscode.TreeItemCollapsibleState.Collapsed, 
					rec, itemTypes.filePath);
				this._items.push(item);
				childs.push(item);
			}
		} else if (element.type === itemTypes.filePath){
			const key = element.label;
			this.resultsGroup[key].forEach(reftem => {
				childs.push(reftem);
			});
		}
		return Promise.resolve(childs);
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

export class Reftem extends vscode.TreeItem {

	constructor(
		public label: string,
		public collapsibleState: vscode.TreeItemCollapsibleState,
		public record: bdd_funcs.Record,
		public type: itemTypes,

		public contextValue?: string,
		public fpath?: string
	) {
		super(label, collapsibleState);
		this.tooltip = `Click to open ${this.label}.`;
		this.command = {
			command: 'bdd.go2Reference',
			title: 'Open workspace in same window',
			arguments: [this],
		};	
	}

	get icon():string{
		var svg = '';
		if(this.type === itemTypes.step){
			svg = 'reference.svg';
		}
		return svg;
	}
}

enum itemTypes {
	filePath,
	step,
	none,
}