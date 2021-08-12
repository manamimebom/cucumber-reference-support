import * as vscode from 'vscode';
import {isUndefined, isNull} from 'util';

export var term = vscode.window.createTerminal('bdd-output');

export class Record {
	text = '';
	file: vscode.Uri = vscode.Uri.prototype;
	line: number = -1;
}

export class Search {
	step_decs: Array<Record> = [];
	step_files: Array<vscode.Uri> = [];
	constructor(decs: Record[], files: vscode.Uri[]) {
		this.step_decs = decs;
		this.step_files = files;
	}
}

export function find_references(){
	return search_feature_files_for_refs().then( (recs)=> {
		var line = vscode.window.activeTextEditor?.selection.active.line;
		if ( line === undefined) {return;}
		if (vscode.window.activeTextEditor?.selection.active.character === 0) {
			line -= 1;
		}
		var doc = vscode.window.activeTextEditor?.document;
		if ( doc === undefined) {return;}
		var dec = vscode.window.activeTextEditor?.document.lineAt(line).text;

		var text = dec;
		if (text === undefined) {return;}
		if(text.indexOf(')') < 0){
			
			text = text.replace('+', '');
			text = text.replace('\\', '');
			text += doc.lineAt(line + 1).text;
			text = format_decorator(text);
		}else{
			text = format_decorator(text);
		}
		dec = text;

		dec.replace('{', "\"").replace('}', "\"");

		var rec_from_dec = new Record();
		rec_from_dec.text = dec;

		var results: Record[] = [];
		if (rec_from_dec.text === ''){
			return results;
		}
		recs.forEach(rec =>{
			if(record_matches_step(rec_from_dec, rec.text))	{
				results.push(rec);
			}
		});
		
		vscode.commands.executeCommand("workbench.view.extension.bdd_references_container");
		return results;
	});
}

export function format_decorator(text: string): string{
	var reg = text.toLowerCase().match(/@(given|when|then)/);
	if(isNull(reg)){ return '';}
	reg = text.match(/\((u'|"|').*['"][ ]*\)/);
	if(isNull(reg)){ return '';}
	var body =  reg[0];
	body = body.replace(/\((u'|"|')/, '');
	body = body.replace(/['"][ ]*\)/, '');

	reg = text.match(/@[A-Za-z][a-z]*\(/);
	if(isNull(reg)){return '';}
	var keyw = reg[0].replace('@', '').replace('(', '').trim();

	var result =  keyw + ' ' + body;
	return result;
}

export function record_matches_step(record: Record, step: string|undefined, findDecorator=false): Boolean
{
	step = step?.toLowerCase();
	var rec_text = record.text.toLowerCase();

	if ( isUndefined(step) ||  isUndefined(rec_text)){ return false;}

	if ( step.indexOf('and') === 0){
		var sb = rec_text.split(' ')[0];
		step = step.replace('and', sb);
	}
	else if ( step.indexOf('but') === 0){
		var sb = rec_text.split(' ')[0];
		step = step.replace('but', sb);
	}
	
	rec_text = "/" + rec_text.replace(/{[^ ]+[}]/g, '.*') + "/" ;
	var reg = step.match(eval(rec_text));
	if (reg !== null){
		return true;
	}
  	return false;
}

export function get_lines_starting(document: vscode.TextDocument, start_words: Array<string>, spl: string): Record[]
{
	var lines_count = document.lineCount;
	var i = 0;
	var records = [];
	for (i = 0; i<lines_count; i++)
	{
		var line = document.lineAt(i).text.trim();
		if (line === ""){continue;}

		var start_word = line.split(spl)[0].trim();
		if ( start_words.indexOf(start_word) >= 0){
			var rec = new Record();
			rec.text = line;
			rec.file = document.uri;
			rec.line = i;
			records.push(rec);
		}
	}
	return records;
}

export function get_doc_from_path(path: string): Thenable<vscode.TextDocument>{
	const uri = vscode.Uri.file(path);
	return vscode.workspace.openTextDocument(uri);
}

export function show_doc(path: string, col=1): Thenable<vscode.TextEditor>{
	return get_doc_from_path(path).then(doc => {
		return vscode.window.showTextDocument(doc, col, false);
	});
}

export function select_focus_line(doc: vscode.TextEditor, line: number, type=3)
{
	var pos = new vscode.Position(line, 0);
	var pos2 = new vscode.Position(line+1, 0);
	doc.selection = new vscode.Selection(pos, pos2);
	var range = new vscode.Range(pos, pos2);
	doc.revealRange(range, type);
}

export function search_feature_files_for_refs(): Thenable<Record[]>{


	return vscode.workspace.findFiles("**/features/**/*.feature").then((files ) => {
		
		var promises: Array<Thenable<Record[]>> = [];
		files.forEach((file) => {
			var prom = vscode.workspace.openTextDocument(file).then((document) => {
				var start_words = ['Given', 'When', 'Then', 'And'];
				var feature_refs:Array<Record> = [] = [];

				var decs : Array<Record> =
					get_lines_starting(document, start_words, " ");
				decs.forEach(element => {
					// element.text = element.text.replace('','');
					element.text = element.text.trim();
					feature_refs.push(element);
				});
				return Promise.resolve(feature_refs);
			});

			promises.push(prom);
		});

		return Promise.all(promises).then(pr=>{
			var childs: Array<Record> = [];
			pr.forEach( arr => {
				arr.forEach(element => {
					childs.push(element);
				});
			});
			return childs;
		});
	});

}

vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
	if ((document.languageId === "feature"
		|| (document.languageId === "python" && document.fileName.indexOf('step_defs')>=0) )
		&& document.uri.scheme === "file") {
			vscode.commands.executeCommand('bdd.search_for_steps');
    }
});


