import {getProvider} from '../server/assistant.js';
for(const [id,name] of [['rabbit1','Rescue Rabbit 1'],['rabbit2','Rescue Rabbit 2']]){
 const p=getProvider(id);
 if(!p){console.error(name+': falta su clave.');process.exitCode=1;continue;}
 try{const r=await p.suggest('Hay una luminaria apagada en el parque central de Los Olivos.',{draft:{},mode:'text',conversation:[],mascotName:name},'Breve y directo');console.log(JSON.stringify({mascot:name,ok:true,reply:r.reply}));}catch{console.error(name+': no se pudo validar la conexión. Revisa clave, cuota y modelo.');process.exitCode=1;}
}
