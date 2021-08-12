import * as fs from 'fs';
import { isNull, isUndefined, TextDecoder } from "util";
import * as bdd_funcs from './bdd_funcs';
import { stdout } from 'process';


export function items_in_dir(path: string, regex: RegExp): string[]{
    var filenames: string[] = fs.readdirSync(path);
    var items = filenames.filter(it => it.match(regex));
    for(var  i=0; i<items.length; i+=1){items[i]=items[i];}
    return items;
}

export function is_any_item_in_subdirs(paths: string[], reg: RegExp): boolean{
        for(var f = 0; f < paths.length; f += 1){
            var path = paths[f];
            if(path.indexOf('/') !== path.length-1){path += '/';}
            var filenames: string[] = fs.readdirSync(path);
            var sub_dirs = filenames.filter(it => it.match(/^\w*$/));
            for(var  i=0; i<sub_dirs.length; i+=1){sub_dirs[i]=path + sub_dirs[i] + '/';}
            var features = filenames.filter(it => it.match(reg));
            if(features.length >=1){
                return true;
            }
            try{
                var ret = is_any_item_in_subdirs(sub_dirs, reg);
                if(ret) {return true;}
            }
            catch{}
        }
        return false;
}

export function read_file(filename: string): string{
    try{
        var bytes =  fs.readFileSync(filename);
        var text = new TextDecoder("utf-8").decode(bytes);
        return text;
    }catch{}

    return '';
}

export function exec_command_sync(com: string): string {
    console.log("exec_com_sync: " + com);
    var stdout;
    try{
        const execSync = require('child_process').execSync;
        stdout = execSync(com);
    }catch (err){
        // console.error(err);
        stdout =  err.stdout;
    };
    return new TextDecoder("utf-8").decode(stdout);
}

export function names_in_dir(path: string): string[]{
    const fs = require('fs');
    let filenames: string[] = fs.readdirSync(path);
    return filenames.filter(it => it.match(/^\w*$/) || it.match(/^\w*\.py$/g));
}

export async function exec_com_async(com: string) {
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);  
    console.log("exec_com_async: " + com);
    try {
        const { stdout, stderr } = await exec(com);
        return stdout;
    }catch (err){
        // console.error(err);
        return err.stdout;
    };
};

export function list_remove(list: string[], keys: string[]): string[] {
    keys.forEach(key => {
        var index = list.indexOf(key, 0);
        do{
            if (index > -1) {
                list.splice(index, 1);
            }
            index = list.indexOf(key, 0);
        }while(index>=0);
    });
   return list;
}