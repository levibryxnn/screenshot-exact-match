export function parsePoliticianId(raw:string):string|null {try{const id=decodeURIComponent(raw);return /^camara:[1-9]\d*$/.test(id)?id:null}catch{return null}}
